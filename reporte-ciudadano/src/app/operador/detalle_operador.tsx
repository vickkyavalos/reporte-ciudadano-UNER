import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ESTADOS } from "@/constants/estados";
import {
  guardarCambiosDetalleOperador,
  obtenerCatalogosDetalleOperador,
  obtenerDetalleOperador,
} from "@/servicios/detalleOperadorService";
import type {
  CatalogosDetalleOperador,
  DetalleReclamoOperador,
} from "@/tipos/detalleOperador.interface";
import type { EstadoReporte } from "@/tipos/reporte.interface";

const estados: EstadoReporte[] = [
  "recibido",
  "en_revision",
  "asignado",
  "resuelto",
  "rechazado",
];

const etiquetaEstado = (estado: EstadoReporte) =>
  estado === "recibido" ? "Pendiente" : ESTADOS[estado].etiqueta;

const formatoFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(fecha))
    .replace(".", "");

type ModalDetalle = "estado" | "cuadrilla" | "duplicado" | null;

export default function DetalleOperadorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reclamoId = typeof id === "string" ? id : "";
  const [detalle, setDetalle] = useState<DetalleReclamoOperador | null>(null);
  const [catalogos, setCatalogos] = useState<CatalogosDetalleOperador>({
    cuadrillas: [],
    reportes: [],
  });
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoReporte>("recibido");
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState<string | null>(null);
  const [duplicadoSeleccionado, setDuplicadoSeleccionado] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [fotosArreglo, setFotosArreglo] = useState<string[]>([]);
  const [modalAbierto, setModalAbierto] = useState<ModalDetalle>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotoProblemaError, setFotoProblemaError] = useState(false);
  const [fotosArregloConError, setFotosArregloConError] = useState<Set<string>>(
    () => new Set(),
  );

  const cargarDetalle = useCallback(async () => {
    if (!reclamoId) {
      setError("No se indicó qué reclamo mostrar.");
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const reclamo = await obtenerDetalleOperador(reclamoId);
      if (!reclamo.zonaId) {
        throw new Error("El reclamo no tiene una zona válida.");
      }
      const opciones = await obtenerCatalogosDetalleOperador(
        reclamo.zonaId,
        reclamo.id,
      );
      setDetalle(reclamo);
      setCatalogos(opciones);
      setEstadoSeleccionado(reclamo.estado);
      setCuadrillaSeleccionada(reclamo.cuadrillaId);
      setDuplicadoSeleccionado(reclamo.duplicadoDe);
      setFotosArreglo(
        reclamo.fotosArreglo ??
          (reclamo.fotoArreglo ? [reclamo.fotoArreglo] : []),
      );
      setFotosArregloConError(new Set());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el reclamo.");
    } finally {
      setCargando(false);
    }
  }, [reclamoId]);

  useEffect(() => {
    void Promise.resolve().then(cargarDetalle);
  }, [cargarDetalle]);

  const reporteDuplicado = useMemo(
    () => catalogos.reportes.find((reporte) => reporte.id === duplicadoSeleccionado) ?? null,
    [catalogos.reportes, duplicadoSeleccionado]
  );
  const cuadrilla = useMemo(
    () => catalogos.cuadrillas.find((actual) => actual.id === cuadrillaSeleccionada) ?? null,
    [catalogos.cuadrillas, cuadrillaSeleccionada]
  );

  const adjuntarFoto = async () => {
    setError(null);
    const disponibles = 3 - fotosArreglo.length;
    if (disponibles <= 0) {
      setError("Se pueden adjuntar hasta tres fotos del arreglo.");
      return;
    }
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: disponibles,
        quality: 0.8,
      });
      if (!resultado.canceled && resultado.assets.length > 0) {
        const seleccionadas = resultado.assets
          .map((asset) => asset.uri)
          .filter((uri) => !fotosArreglo.includes(uri));
        setFotosArreglo((actuales) =>
          Array.from(new Set([...actuales, ...seleccionadas])).slice(0, 3),
        );
        setFotosArregloConError((actuales) => {
          const siguientes = new Set(actuales);
          seleccionadas.forEach((uri) => siguientes.delete(uri));
          return siguientes;
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo seleccionar la foto.");
    }
  };

  const guardar = async () => {
    if (!detalle) return;
    if (!comentario.trim()) {
      setError("El comentario es obligatorio: explicá el motivo del cambio.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await guardarCambiosDetalleOperador(detalle.id, {
        estado: estadoSeleccionado,
        cuadrillaId: cuadrillaSeleccionada,
        comentario: comentario.trim(),
        fotosArreglo,
        duplicadoDe: duplicadoSeleccionado,
      });
      Alert.alert("Cambios guardados", "El reclamo se actualizó correctamente.");
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirModal = (modal: Exclude<ModalDetalle, null>) => {
    setError(null);
    setModalAbierto(modal);
  };

  if (cargando) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#202A39" />
        <Text style={styles.loadingText}>Cargando reclamo...</Text>
      </View>
    );
  }

  if (!detalle) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? "No encontramos este reclamo."}</Text>
        <Pressable onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryText}>Volver a la bandeja</Text>
        </Pressable>
      </View>
    );
  }

  const asignacionSolicitada = Boolean(cuadrillaSeleccionada) && (
    cuadrillaSeleccionada !== detalle.cuadrillaId ||
    (estadoSeleccionado === "asignado" && detalle.estado !== "asignado")
  );
  const estadoFinalPrevisto =
    asignacionSolicitada && estadoSeleccionado === detalle.estado
      ? "asignado"
      : estadoSeleccionado === "asignado" && !asignacionSolicitada
        ? detalle.estado
        : estadoSeleccionado;
  const puedeAdjuntarFoto =
    estadoFinalPrevisto === "asignado" || estadoFinalPrevisto === "resuelto";

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bandeja"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.headerCode}>{detalle.codigo}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 104 }]}
        keyboardShouldPersistTaps="handled"
      >
        {detalle.fotoProblema && !fotoProblemaError ? (
          <Image
            source={{ uri: detalle.fotoProblema }}
            style={styles.heroImage}
            resizeMode="cover"
            onError={() => setFotoProblemaError(true)}
            accessibilityLabel="Foto del problema reportado"
          />
        ) : (
          <View style={[styles.heroImage, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>Foto del problema no disponible</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.reportHeading}>
            <View style={styles.statusLine}>
              <Text style={[styles.statusBadge, { color: ESTADOS[detalle.estado].texto, backgroundColor: ESTADOS[detalle.estado].fondo }]}>
                {etiquetaEstado(detalle.estado)}
              </Text>
              <Text numberOfLines={1} style={styles.address}>{detalle.direccion}</Text>
            </View>
            <Text style={styles.reportMeta}>{detalle.zona} • {formatoFecha(detalle.creadoEn)}</Text>
          </View>

          <View style={styles.adhesionBox}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.adhesionText}>
              {detalle.adhesiones} vecinos se sumaron a este reclamo
            </Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>ACCIONES DEL OPERADOR</Text>

          <Text style={styles.fieldLabel}>Cambiar estado</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Estado: ${etiquetaEstado(estadoSeleccionado)}. Cambiar estado`}
            onPress={() => abrirModal("estado")}
            style={styles.select}
          >
            <Text style={styles.selectText}>{etiquetaEstado(estadoSeleccionado)}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>

          <Text style={styles.fieldLabel}>Asignar a Cuadrilla</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => abrirModal("cuadrilla")}
            style={styles.select}
          >
            <Text numberOfLines={1} style={[styles.selectText, !cuadrilla && styles.placeholder]}>
              {cuadrilla?.nombre ?? "Seleccionar cuadrilla"}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>

          <Text style={styles.fieldLabel}>Duplicado de</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => abrirModal("duplicado")}
            style={styles.select}
          >
            <Text numberOfLines={1} style={[styles.selectText, !reporteDuplicado && styles.placeholder]}>
              {reporteDuplicado ? reporteDuplicado.codigo : "No es un duplicado"}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          {reporteDuplicado && (
            <Text style={styles.helperText}>
              Al guardar, se sumará una adhesión al reclamo original.
            </Text>
          )}

          <View style={styles.commentLabelLine}>
            <Text style={styles.fieldLabel}>Comentario *</Text>
            <Text style={styles.required}>Obligatorio</Text>
          </View>
          <TextInput
            accessibilityLabel="Motivo de los cambios"
            value={comentario}
            onChangeText={setComentario}
            placeholder="Explicá el motivo del cambio de estado o de la asignación..."
            placeholderTextColor="#8791A1"
            multiline
            textAlignVertical="top"
            style={styles.commentInput}
          />
          <Text style={styles.helperText}>El motivo quedará registrado en el reclamo.</Text>

          <Text style={styles.fieldLabel}>Foto del arreglo</Text>
          {fotosArreglo.map((foto, indice) =>
            fotosArregloConError.has(foto) ? (
              <View key={foto} style={[styles.repairImage, styles.imageFallback]}>
                <Text style={styles.imageFallbackText}>
                  No se pudo cargar la foto {indice + 1}
                </Text>
              </View>
            ) : (
              <Image
                key={foto}
                source={{ uri: foto }}
                style={styles.repairImage}
                resizeMode="cover"
                onError={() =>
                  setFotosArregloConError((actuales) => new Set(actuales).add(foto))
                }
                accessibilityLabel={`Foto adjunta del arreglo ${indice + 1}`}
              />
            ),
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adjuntar fotos del arreglo"
            disabled={fotosArreglo.length >= 3 || !puedeAdjuntarFoto}
            onPress={() => void adjuntarFoto()}
            style={[
              styles.photoButton,
              (fotosArreglo.length >= 3 || !puedeAdjuntarFoto) &&
                styles.photoButtonDisabled,
            ]}
          >
            <Ionicons name="camera-outline" size={16} color="#202A39" />
            <Text style={styles.photoButtonText}>
              {fotosArreglo.length >= 3
                ? "Máximo de 3 fotos"
                : fotosArreglo.length > 0
                  ? "Agregar otra foto del arreglo"
                  : "Adjuntar foto del arreglo"}
            </Text>
          </Pressable>
          <Text style={styles.helperText}>
            {puedeAdjuntarFoto
              ? "Hasta 3 fotos. Obligatoria al cerrar el reclamo como Resuelto y debe mostrar el trabajo terminado."
              : "Las fotos se habilitan cuando el reclamo está asignado o resuelto."}
          </Text>

          {detalle.descripcion && (
            <>
              <Text style={styles.fieldLabel}>Descripción del vecino</Text>
              <Text style={styles.description}>{detalle.descripcion}</Text>
            </>
          )}
          {error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          accessibilityRole="button"
          disabled={guardando}
          onPress={() => void guardar()}
          style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalAbierto !== null}
        onRequestClose={() => setModalAbierto(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalAbierto(null)}>
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>
              {modalAbierto === "estado"
                ? "Cambiar estado"
                : modalAbierto === "cuadrilla"
                  ? "Asignar cuadrilla"
                  : "Marcar como duplicado"}
            </Text>
            <ScrollView style={styles.optionsList}>
              {modalAbierto === "estado" && estados.map((estado) => (
                <Pressable
                  key={estado}
                  onPress={() => {
                    setEstadoSeleccionado(estado);
                    setModalAbierto(null);
                  }}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>{etiquetaEstado(estado)}</Text>
                  {estado === estadoSeleccionado && <Text style={styles.optionCheck}>✓</Text>}
                </Pressable>
              ))}
              {modalAbierto === "cuadrilla" && (
                <>
                  <Pressable
                    onPress={() => {
                      setCuadrillaSeleccionada(null);
                      setModalAbierto(null);
                    }}
                    style={styles.option}
                  >
                    <Text style={styles.optionText}>Sin asignar</Text>
                    {!cuadrillaSeleccionada && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                  {catalogos.cuadrillas.map((opcion) => (
                    <Pressable
                      key={opcion.id}
                      onPress={() => {
                        setCuadrillaSeleccionada(opcion.id);
                        setModalAbierto(null);
                      }}
                      style={styles.option}
                    >
                      <Text style={styles.optionText}>{opcion.nombre}</Text>
                      {opcion.id === cuadrillaSeleccionada && <Text style={styles.optionCheck}>✓</Text>}
                    </Pressable>
                  ))}
                </>
              )}
              {modalAbierto === "duplicado" && (
                <>
                  <Pressable
                    onPress={() => {
                      setDuplicadoSeleccionado(null);
                      setModalAbierto(null);
                    }}
                    style={styles.option}
                  >
                    <Text style={styles.optionText}>No es un duplicado</Text>
                    {!duplicadoSeleccionado && <Text style={styles.optionCheck}>✓</Text>}
                  </Pressable>
                  {catalogos.reportes
                    .filter((reporte) => reporte.id !== detalle.id)
                    .map((reporte) => (
                      <Pressable
                        key={reporte.id}
                        onPress={() => {
                          setDuplicadoSeleccionado(reporte.id);
                          setModalAbierto(null);
                        }}
                        style={styles.option}
                      >
                        <Text numberOfLines={1} style={styles.optionText}>
                          {reporte.codigo} • {reporte.tipo}, {reporte.direccion}
                        </Text>
                        {reporte.id === duplicadoSeleccionado && <Text style={styles.optionCheck}>✓</Text>}
                      </Pressable>
                    ))}
                </>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2F3F5" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F2F3F5" },
  loadingText: { marginTop: 10, color: "#667085", fontSize: 13 },
  header: {
    minHeight: 52, flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingBottom: 8, backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  backButton: { width: 22, height: 32, justifyContent: "center" },
  backIcon: { color: "#172033", fontSize: 32, lineHeight: 34 },
  headerCode: { flex: 1, color: "#172033", fontSize: 14, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  heroImage: { width: "100%", height: 190, backgroundColor: "#D8DDE4" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  imageFallbackText: { color: "#667085", fontSize: 13 },
  formCard: {
    marginHorizontal: 14, marginTop: 14, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "#E3E6EB", backgroundColor: "#FFFFFF",
  },
  reportHeading: { marginBottom: 12 },
  statusLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  statusBadge: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, fontSize: 9, fontWeight: "600" },
  address: { flex: 1, color: "#667085", fontSize: 10, textAlign: "right" },
  reportMeta: { marginTop: 6, color: "#667085", fontSize: 11 },
  adhesionBox: {
    minHeight: 30, flexDirection: "row", alignItems: "center", gap: 9,
    paddingHorizontal: 10, borderRadius: 7, backgroundColor: "#F1F2F4",
  },
  bullet: { color: "#344054", fontSize: 13, fontWeight: "700" },
  adhesionText: { color: "#202A39", fontSize: 10, fontWeight: "600" },
  divider: { height: 1, marginVertical: 12, backgroundColor: "#E5E7EB" },
  sectionTitle: { marginBottom: 10, color: "#687386", fontSize: 9, fontWeight: "700" },
  fieldLabel: { marginTop: 9, marginBottom: 5, color: "#202A39", fontSize: 10, fontWeight: "700" },
  select: {
    minHeight: 37, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 9, borderWidth: 1, borderColor: "#D5DAE1", borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  selectText: { flex: 1, color: "#263246", fontSize: 11 },
  placeholder: { color: "#667085" },
  chevron: { marginLeft: 8, color: "#667085", fontSize: 16 },
  helperText: { marginTop: 5, color: "#788394", fontSize: 9, lineHeight: 13 },
  commentLabelLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  required: { marginTop: 8, color: "#667085", fontSize: 9 },
  commentInput: {
    minHeight: 62, paddingHorizontal: 9, paddingTop: 9, paddingBottom: 8,
    borderWidth: 1, borderColor: "#D5DAE1", borderRadius: 7,
    color: "#263246", fontSize: 10, lineHeight: 15,
  },
  repairImage: { width: "100%", height: 130, marginBottom: 8, borderRadius: 8, backgroundColor: "#E5E7EB" },
  photoButton: {
    minHeight: 37, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: "#D5DAE1", borderRadius: 7, backgroundColor: "#FFFFFF",
  },
  photoButtonDisabled: { opacity: 0.55 },
  photoButtonText: { color: "#202A39", fontSize: 10, fontWeight: "600" },
  description: { color: "#475467", fontSize: 11, lineHeight: 16 },
  errorText: { marginTop: 10, color: "#B42318", fontSize: 11, lineHeight: 16, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 7, backgroundColor: "#202A39" },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  footer: { paddingHorizontal: 14, paddingTop: 10, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  saveButton: {
    minHeight: 46, alignItems: "center", justifyContent: "center",
    borderRadius: 7, backgroundColor: "#202A39",
  },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  modalBackdrop: { flex: 1, justifyContent: "center", paddingHorizontal: 22, backgroundColor: "rgba(17, 24, 39, 0.4)" },
  optionsCard: { maxHeight: "75%", overflow: "hidden", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderRadius: 14, backgroundColor: "#FFFFFF" },
  optionsTitle: { marginBottom: 8, color: "#172033", fontSize: 16, fontWeight: "700" },
  optionsList: { flexGrow: 0 },
  option: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottomWidth: 1, borderBottomColor: "#EDF0F2" },
  optionText: { flex: 1, color: "#344054", fontSize: 12 },
  optionCheck: { color: "#1570EF", fontSize: 16, fontWeight: "700" },
});