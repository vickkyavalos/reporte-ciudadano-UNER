import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import { COLORES, ESTADOS } from "@/constants/estados";
import { useAuth } from "@/providers/AuthProvider";
import { obtenerReclamosOperador } from "@/servicios/operadorService";
import { buscarDetalleOperadorPorQr } from "@/servicios/detalleOperadorService";
import type {
  CampoFiltroOperador,
  FiltroEstadoOperador,
  OrdenBandejaOperador,
  ReclamoOperador,
} from "@/tipos/operador.interface";
import type { EstadoReporte } from "@/tipos/reporte.interface";
import { BotonCerrarSesion } from "@/components/ui/btn-cerrar-sesion";

const RECLAMOS_POR_PAGINA = 6;

const opcionesEstado: { valor: FiltroEstadoOperador; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "recibido", etiqueta: "Pendiente" },
  { valor: "en_revision", etiqueta: "En revisión" },
  { valor: "asignado", etiqueta: "Asignado" },
  { valor: "resuelto", etiqueta: "Resuelto" },
  { valor: "rechazado", etiqueta: "Rechazado" },
];

const etiquetaEstado = (estado: EstadoReporte) =>
  estado === "recibido" ? "Pendiente" : ESTADOS[estado].etiqueta;

const colorEstado = (estado: EstadoReporte) => {
  if (estado === "recibido") {
    return { ...ESTADOS[estado], fondo: "#FFF2CC", texto: "#A16207", borde: "#F6D98A" };
  }
  if (estado === "en_revision") {
    return { ...ESTADOS[estado], fondo: "#E6F0FF", texto: "#2563EB", borde: "#C5D8FF" };
  }
  return ESTADOS[estado];
};

const formatoFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(fecha))
    .replace(".", "");

export default function OperadorScreen() {
  const router = useRouter();
  const { salir } = useAuth();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [reclamos, setReclamos] = useState<ReclamoOperador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoOperador>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroZona, setFiltroZona] = useState<string | null>(null);
  const [orden, setOrden] = useState<OrdenBandejaOperador>("adhesiones");
  const [pagina, setPagina] = useState(0);
  const [campoAbierto, setCampoAbierto] = useState<CampoFiltroOperador | null>(null);
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [errorQr, setErrorQr] = useState<string | null>(null);
  const qrEnProceso = useRef(false);

  const cargarReclamos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setReclamos(await obtenerReclamosOperador());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los reclamos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void Promise.resolve().then(cargarReclamos);
    }, [cargarReclamos])
  );

  const abrirDetallePorQr = useCallback(async (valor: string) => {
    if (qrEnProceso.current) return;
    qrEnProceso.current = true;
    setErrorQr(null);
    try {
      const reclamo = await buscarDetalleOperadorPorQr(valor);
      setEscanerAbierto(false);
      qrEnProceso.current = false;
      router.push({
        pathname: "/operador/detalle_operador",
        params: { id: reclamo.id },
      });
    } catch (cause) {
      setErrorQr(cause instanceof Error ? cause.message : "No se pudo leer el reclamo del QR.");
      qrEnProceso.current = false;
    }
  }, [router]);

  const tipos = useMemo(
    () => [...new Set(reclamos.map((reclamo) => reclamo.tipo))].sort((a, b) => a.localeCompare(b, "es")),
    [reclamos]
  );
  const zonas = useMemo(
    () => [...new Set(reclamos.map((reclamo) => reclamo.zona))].sort((a, b) => a.localeCompare(b, "es")),
    [reclamos]
  );

  const reclamosFiltrados = useMemo(() => {
    const filtrados = reclamos.filter(
      (reclamo) =>
        (filtroEstado === "todos" || reclamo.estado === filtroEstado) &&
        (filtroTipo === null || reclamo.tipo === filtroTipo) &&
        (filtroZona === null || reclamo.zona === filtroZona)
    );
    return filtrados.sort((a, b) => {
      if (orden === "adhesiones") {
        return b.adhesiones - a.adhesiones || a.creadoEn.localeCompare(b.creadoEn);
      }
      return orden === "recientes"
        ? b.creadoEn.localeCompare(a.creadoEn)
        : a.creadoEn.localeCompare(b.creadoEn);
    });
  }, [filtroEstado, filtroTipo, filtroZona, orden, reclamos]);

  const totalPaginas = Math.max(1, Math.ceil(reclamosFiltrados.length / RECLAMOS_POR_PAGINA));
  const paginaVisible = Math.min(pagina, totalPaginas - 1);
  const reclamosPagina = reclamosFiltrados.slice(
    paginaVisible * RECLAMOS_POR_PAGINA,
    (paginaVisible + 1) * RECLAMOS_POR_PAGINA
  );

  const opcionesFiltro = useMemo(() => {
    if (campoAbierto === "estado") {
      return opcionesEstado.map(({ valor, etiqueta }) => ({ valor, etiqueta }));
    }
    if (campoAbierto === "tipo") {
      return [
        { valor: "", etiqueta: "Todos" },
        ...tipos.map((tipo) => ({ valor: tipo, etiqueta: tipo })),
      ];
    }
    if (campoAbierto === "zona") {
      return [
        { valor: "", etiqueta: "Todas" },
        ...zonas.map((zona) => ({ valor: zona, etiqueta: zona })),
      ];
    }
    return [];
  }, [campoAbierto, tipos, zonas]);

  const valorFiltro = (campo: CampoFiltroOperador) => {
    if (campo === "estado") {
      return opcionesEstado.find((opcion) => opcion.valor === filtroEstado)?.etiqueta ?? "Estado";
    }
    if (campo === "tipo") return filtroTipo ?? "Tipo";
    return filtroZona ?? "Zona";
  };

  const aplicarOpcion = (valor: string) => {
    setPagina(0);
    if (campoAbierto === "estado") setFiltroEstado(valor as FiltroEstadoOperador);
    if (campoAbierto === "tipo") setFiltroTipo(valor || null);
    if (campoAbierto === "zona") setFiltroZona(valor || null);
    setCampoAbierto(null);
  };

  const renderReclamo = (item: ReclamoOperador) => {
    const estado = colorEstado(item.estado);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.tipo} en ${item.direccion}. Estado: ${etiquetaEstado(item.estado)}. Ver detalle`}
        onPress={() => router.push({
          pathname: "/operador/detalle_operador",
          params: { id: item.id },
        })}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.code}>{item.codigo}</Text>
            <Text style={[styles.badge, { color: estado.texto, backgroundColor: estado.fondo }]}>
              {etiquetaEstado(item.estado)}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {item.tipo} • {item.direccion}
          </Text>
          <Text numberOfLines={1} style={styles.rowMeta}>
            {item.zona} • {formatoFecha(item.creadoEn)} • {item.adhesiones} vecinos
          </Text>
        </View>
        <Text style={styles.rowChevron}>›</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Bandeja del operador</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escanear QR de un reclamo"
            onPress={() => {
              qrEnProceso.current = false;
              setErrorQr(null);
              setEscanerAbierto(true);
            }}
            style={styles.scanButton}
          >
            <Text style={styles.scanText}>⌗ QR</Text>
          </Pressable>

          {/* Botón para cerrar sesion */}
          <BotonCerrarSesion />
        </View>
      </View>

      <View style={styles.filters}>
        {(["estado", "tipo", "zona"] as const).map((campo) => (
          <Pressable
            key={campo}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${campo}: ${valorFiltro(campo)}`}
            onPress={() => setCampoAbierto(campo)}
            style={styles.filterButton}
          >
            <Text numberOfLines={1} style={styles.filterLabel}>{valorFiltro(campo)}</Text>
            <Text style={styles.filterChevron}>⌄</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.resultsBar}>
          <Text style={styles.count}>{reclamosFiltrados.length} reclamos</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ordenar por ${orden === "adhesiones" ? "más recientes" : orden === "recientes" ? "más antiguos" : "más adhesiones"}`}
            onPress={() => {
              setPagina(0);
              setOrden((actual) =>
                actual === "adhesiones"
                  ? "recientes"
                  : actual === "recientes"
                    ? "antiguos"
                    : "adhesiones",
              );
            }}
            style={styles.sortButton}
          >
            <Text style={styles.sortText}>
              {orden === "adhesiones"
                ? "Más adhesiones"
                : orden === "recientes"
                  ? "Más recientes"
                  : "Más antiguos"}{" "}
              {orden === "antiguos" ? "↑" : "↓"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeading}>RECLAMO / UBICACIÓN</Text>
            <Text style={styles.tableHeading}>ESTADO</Text>
          </View>
          {cargando ? (
            <ActivityIndicator color="#1A202C" style={styles.loading} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void cargarReclamos()} style={styles.retryButton}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : reclamosFiltrados.length === 0 ? (
            <Text style={styles.emptyState}>No hay reclamos que coincidan con esos filtros.</Text>
          ) : (
            reclamosPagina.map((item) => <View key={item.id}>{renderReclamo(item)}</View>)
          )}
          {!cargando && !error && (
            <View style={styles.pagination}>
              <Text style={styles.paginationCount}>
                {reclamosFiltrados.length === 0
                  ? "Sin reclamos"
                  : `${paginaVisible * RECLAMOS_POR_PAGINA + 1}–${Math.min(
                      (paginaVisible + 1) * RECLAMOS_POR_PAGINA,
                      reclamosFiltrados.length
                    )} de ${reclamosFiltrados.length} reclamos`}
              </Text>
              <View style={styles.paginationControls}>
                <Text style={styles.paginationPage}>{paginaVisible + 1} / {totalPaginas}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Página anterior"
                  disabled={paginaVisible === 0}
                  onPress={() => setPagina(Math.max(0, paginaVisible - 1))}
                  style={styles.pageButton}
                >
                  <Text style={[styles.pageChevron, paginaVisible === 0 && styles.pageDisabled]}>‹</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Página siguiente"
                  disabled={paginaVisible + 1 >= totalPaginas}
                  onPress={() => setPagina(Math.min(totalPaginas - 1, paginaVisible + 1))}
                  style={styles.pageButton}
                >
                  <Text style={[styles.pageChevron, paginaVisible + 1 >= totalPaginas && styles.pageDisabled]}>›</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={campoAbierto !== null}
        onRequestClose={() => setCampoAbierto(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCampoAbierto(null)}>
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Filtrar por {campoAbierto}</Text>
            <ScrollView style={styles.optionsList}>
              {opcionesFiltro.map((opcion) => (
                <Pressable
                  key={opcion.valor}
                  onPress={() => aplicarOpcion(opcion.valor)}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>{opcion.etiqueta}</Text>
                  {opcion.etiqueta === (campoAbierto ? valorFiltro(campoAbierto) : "")
                    && <Text style={styles.optionCheck}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={escanerAbierto}
        onRequestClose={() => setEscanerAbierto(false)}
      >
        <View style={styles.scannerScreen}>
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.headerTitle}>Escanear QR del reclamo</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar escáner"
              onPress={() => setEscanerAbierto(false)}
            >
              <Text style={styles.closeButton}>×</Text>
            </Pressable>
          </View>
          {cameraPermission?.granted ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => void abrirDetallePorQr(data)}
            />
          ) : (
            <View style={styles.cameraPermission}>
              <Text style={styles.permissionText}>
                Necesitamos acceso a la cámara para leer el QR del reclamo.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void requestCameraPermission()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Permitir cámara</Text>
              </Pressable>
            </View>
          )}
          {errorQr && (
            <View style={styles.qrError}>
              <Text style={styles.errorText}>{errorQr}</Text>
              <Pressable onPress={() => setErrorQr(null)} style={styles.retryButton}>
                <Text style={styles.retryText}>Volver a escanear</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2F3F5" },
  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#172033" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  scanButton: {
    height: 32, justifyContent: "center", paddingHorizontal: 10, borderRadius: 7,
    backgroundColor: "#202A39",
  },
  scanText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  profileButton: {
    width: 32, height: 32, alignItems: "center", justifyContent: "center",
    borderRadius: 16, backgroundColor: "#F2F3F5", borderWidth: 1, borderColor: "#E5E7EB",
  },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  filterButton: {
    height: 38, flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 9, borderWidth: 1,
    borderColor: "#D5DAE1", borderRadius: 7, backgroundColor: "#FFFFFF",
  },
  filterLabel: { flex: 1, color: "#263246", fontSize: 12, fontWeight: "500" },
  filterChevron: { marginLeft: 5, color: "#667085", fontSize: 16 },
  resultsBar: {
    minHeight: 40, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 15,
  },
  content: { flex: 1 },
  contentInner: { paddingBottom: 12 },
  count: { color: "#1F2937", fontSize: 13, fontWeight: "700" },
  sortButton: { paddingVertical: 8, paddingLeft: 10 },
  sortText: { color: "#717B8A", fontSize: 11 },
  listCard: {
    marginHorizontal: 14, overflow: "hidden", borderRadius: 10,
    borderWidth: 1, borderColor: "#E0E4E9", backgroundColor: "#FFFFFF",
  },
  tableHeader: {
    height: 27, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 9, backgroundColor: "#F6F7F9",
    borderBottomWidth: 1, borderBottomColor: "#E6E8EC",
  },
  tableHeading: { color: "#687386", fontSize: 8, fontWeight: "700" },
  row: {
    minHeight: 66, flexDirection: "row", alignItems: "center",
    paddingLeft: 9, paddingRight: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBEF",
  },
  rowPressed: { backgroundColor: "#F8FAFC" },
  rowContent: { flex: 1, gap: 3 },
  rowTop: { minHeight: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  code: { color: "#687386", fontSize: 9, fontWeight: "500" },
  badge: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, fontSize: 9, fontWeight: "600" },
  rowTitle: { color: "#202A39", fontSize: 11, fontWeight: "700" },
  rowMeta: { color: "#798394", fontSize: 9 },
  rowChevron: { marginLeft: 9, color: "#667085", fontSize: 23, lineHeight: 25 },
  pagination: {
    minHeight: 39, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 9, borderTopWidth: 1, borderTopColor: "#E6E8EC",
  },
  paginationCount: { color: "#7B8492", fontSize: 9 },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  paginationPage: { color: "#172033", fontSize: 10, fontWeight: "600" },
  pageButton: { minWidth: 20, alignItems: "center" },
  pageChevron: { color: "#475467", fontSize: 22, lineHeight: 24 },
  pageDisabled: { color: "#C5CAD1" },
  loading: { paddingVertical: 32 },
  emptyState: { alignItems: "center", padding: 24, color: "#687386", fontSize: 12, textAlign: "center" },
  errorText: { color: "#B42318", fontSize: 12, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: "#202A39" },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  modalBackdrop: {
    flex: 1, justifyContent: "center", paddingHorizontal: 20,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  optionsCard: {
    maxHeight: "70%", overflow: "hidden", padding: 16,
    borderRadius: 14, backgroundColor: "#FFFFFF",
  },
  optionsTitle: { marginBottom: 8, color: "#172033", fontSize: 16, fontWeight: "700" },
  optionsList: { flexGrow: 0 },
  option: {
    minHeight: 46, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EDF0F2",
  },
  optionText: { color: "#344054", fontSize: 14 },
  optionCheck: { color: "#1570EF", fontSize: 16, fontWeight: "700" },
  closeButton: { paddingHorizontal: 4, color: "#667085", fontSize: 27, lineHeight: 29 },
  scannerScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  scannerHeader: {
    minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  camera: { flex: 1 },
  cameraPermission: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  permissionText: { marginBottom: 16, color: "#475467", textAlign: "center", fontSize: 14 },
  qrError: { padding: 16, backgroundColor: "#FFFFFF" },
});
