import { hayInternet } from "@/servicios/red";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "@react-native-vector-icons/ionicons";
import { useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useNetworkState } from "expo-network";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectorPunto, VistaPunto } from "@/components/map/selector-punto";
import { AvisoDuplicados } from "@/components/reportes/aviso-duplicados";
import { CamaraReporte } from "@/components/reportes/camara-reporte";
import { ConfirmacionReporte } from "@/components/reportes/confirmacion-reporte";
import { NotaDeVoz } from "@/components/reportes/nota-de-voz";
import { COLORES } from "@/constants/estados";
import { asignarZona } from "@/hooks/geo";
import { CENTRO_CIUDAD, useUbicacion } from "@/hooks/use-ubicacion";
import {
  borrarArchivoLocal,
  guardarArchivoLocal,
  LIMITE_FOTO_BYTES,
  tamanoArchivoLocal,
} from "@/servicios/archivosLocales";
import { obtenerUsuario } from "@/servicios/authService";
import { borrarBorrador, cargarBorrador, guardarBorrador } from "@/servicios/borradorService";
import {
  buscarDuplicados,
  crearReporte,
  obtenerTipos,
  obtenerZonas,
  sumarseAReporte,
} from "@/servicios/reportes";
import { direccionDePunto, textoPuntoSinDireccion } from "@/servicios/ubicacionService";
import type { Coordenadas, Reporte, TipoDeReporte } from "@/tipos/reporte.interface";
import type { Zona } from "@/tipos/zona.interface";
import { distanciaMetros } from "@/utils/formato";

type NombreIcono = ComponentProps<typeof Icon>["name"];

const MAX_FOTOS = 2;
const MAX_DESCRIPCION = 1000;
const EXTENSIONES_FOTO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function NuevoReporteScreen() {
  const router = useRouter();
  const margenes = useSafeAreaInsets();
  const red = useNetworkState();
  const autorId = obtenerUsuario()?.id ?? null;

  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(true);
  const [errorTipos, setErrorTipos] = useState(false);

  const [tipoId, setTipoId] = useState<string | null>(null);
  const [fotosUris, setFotosUris] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [puntoManual, setPuntoManual] = useState<Coordenadas | null>(null);
  const [borradorListo, setBorradorListo] = useState(false);

  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [guardando, setGuardando] = useState(false);
  const [enviado, setEnviado] = useState<Reporte | null>(null);
  const [duplicados, setDuplicados] = useState<Reporte[]>([]);
  const [sumandoId, setSumandoId] = useState<string | null>(null);

  const { ubicacion, encontrada, precisa, permitido, error: errorGps } = useUbicacion({
    precision: Location.Accuracy.High,
    precisionInicial: Location.Accuracy.Balanced,
    edadMaximaMs: 60000,
    esperaMs: 15000,
  });
  const punto = puntoManual ?? (encontrada ? ubicacion : null);
  const clavePunto = punto ? `${punto.latitud},${punto.longitud}` : null;
  const [direccionHallada, setDireccionHallada] = useState<{ clave: string; texto: string | null } | null>(null);
  const direccion = direccionHallada?.clave === clavePunto ? direccionHallada?.texto ?? null : null;
  const fueraDeLaCiudad = punto !== null && zonas.length > 0 && asignarZona(punto, zonas, 0) === null;

  const cargarCatalogos = async () => {
    setCargandoTipos(true);
    setErrorTipos(false);
    try {
      const [listaTipos, listaZonas] = await Promise.all([obtenerTipos(), obtenerZonas()]);
      setTipos(listaTipos);
      setZonas(listaZonas);
    } catch {
      setErrorTipos(true);
    } finally {
      setCargandoTipos(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(cargarCatalogos);
  }, []);

  useEffect(() => {
    if (!autorId) return;
    cargarBorrador(autorId)
      .then((borrador) => {
        if (!borrador) return;
        setTipoId(borrador.tipoId);
        setFotosUris(borrador.fotosUris);
        setDescripcion(borrador.descripcion);
        setAudioUri(borrador.audioUri);
        setPuntoManual(borrador.puntoManual);
      })
      .catch(() => undefined)
      .finally(() => setBorradorListo(true));
  }, [autorId]);

  useEffect(() => {
    if (!autorId || !borradorListo || enviado) return;
    void guardarBorrador(autorId, { tipoId, fotosUris, descripcion, audioUri, puntoManual });
  }, [autorId, borradorListo, enviado, tipoId, fotosUris, descripcion, audioUri, puntoManual]);

  useEffect(() => {
    if (!clavePunto || !punto) return;
    let vigente = true;
    void direccionDePunto(punto).then((texto) => {
      if (vigente) setDireccionHallada({ clave: clavePunto, texto });
    });
    return () => {
      vigente = false;
    };
  }, [clavePunto, punto]);

  const asegurarPermisoCamara = async (): Promise<boolean> => {
    const permiso = permisoCamara?.granted ? permisoCamara : await pedirPermisoCamara();
    if (permiso.granted) return true;
    Alert.alert(
      "Necesitamos la cámara",
      "La foto del problema es obligatoria: sin ella no podemos tomar el reporte. Habilitá la cámara desde la configuración del teléfono o elegí una foto de la galería.",
      [
        { text: "Ahora no", style: "cancel" },
        { text: "Abrir configuración", onPress: () => void Linking.openSettings() },
      ],
    );
    return false;
  };

  const agregarFoto = async (uri: string, extension: string) => {
    if (tamanoArchivoLocal(uri) > LIMITE_FOTO_BYTES) {
      Alert.alert("La foto es muy pesada", "Probá con otra foto, por favor.");
      return;
    }
    try {
      const local = await guardarArchivoLocal(uri, "fot", extension);
      setFotosUris((actuales) => [...actuales, local].slice(0, MAX_FOTOS));
    } catch {
      Alert.alert("No se pudo guardar la foto", "Probá de nuevo, por favor.");
    }
  };

  const abrirCamara = async () => {
    if (await asegurarPermisoCamara()) setCamaraAbierta(true);
  };

  const abrirGaleria = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    const foto = resultado.canceled ? undefined : resultado.assets[0];
    if (!foto) return;
    const extension = EXTENSIONES_FOTO[foto.mimeType ?? "image/jpeg"];
    if (!extension) {
      Alert.alert("No podemos usar esa foto", "Elegí una foto en formato JPG o PNG, o sacá una nueva.");
      return;
    }
    await agregarFoto(foto.uri, extension);
  };

  const quitarFoto = (uri: string) => {
    borrarArchivoLocal(uri);
    setFotosUris((actuales) => actuales.filter((actual) => actual !== uri));
  };

  const enviar = async () => {
    const faltante = !tipoId
      ? "Elegí qué tipo de problema es."
      : fotosUris.length === 0
        ? "Sacale una foto al problema. Sin foto no podemos tomar el reporte."
        : !punto
          ? "Marcá en el mapa dónde está el problema."
          : fueraDeLaCiudad
            ? "Ese punto queda fuera de Gualeguaychú. Corregilo en el mapa."
            : grabandoAudio
              ? "Terminá de grabar la nota de voz antes de enviar."
              : null;
    if (faltante || !tipoId || !punto) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Falta un dato", faltante ?? "");
      return;
    }


    if (hayInternet(red)) {
      setGuardando(true);
      const cercanos = await buscarDuplicados(punto, tipoId);
      setGuardando(false);
      if (cercanos.length > 0) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setDuplicados(cercanos);
        return;
      }
    }
    await guardarReporte(tipoId, punto);
  };

  const sumarse = async (reporte: Reporte) => {
    setSumandoId(reporte.id);
    try {
      await sumarseAReporte(reporte.id);
      fotosUris.forEach(borrarArchivoLocal);
      if (audioUri) borrarArchivoLocal(audioUri);
      if (autorId) await borrarBorrador(autorId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDuplicados([]);
      router.replace({ pathname: "/reportes/[id]", params: { id: reporte.id } });
    } catch (error) {
      Alert.alert(
        "No pudimos sumarte",
        error instanceof Error ? error.message : "Probá de nuevo, por favor.",
      );
    } finally {
      setSumandoId(null);
    }
  };

  const guardarReporte = async (tipoId: string, punto: Coordenadas) => {
    setGuardando(true);
    try {
      const texto = descripcion.trim();
      const reporte = await crearReporte({
        tipoId,
        fotosUris,
        coordenadas: punto,
        direccion: direccion ?? textoPuntoSinDireccion(punto),
        direccionPendiente: direccion === null,
        descripcion: texto === "" ? null : texto,
        audioUrl: audioUri,
      });
      if (autorId) await borrarBorrador(autorId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEnviado(reporte);
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "No se pudo guardar el reporte",
        error instanceof Error ? error.message : "Probá de nuevo, por favor.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (enviado) {
    return (
      <ConfirmacionReporte
        reporteInicial={enviado}
        onVerMisReportes={() => router.replace("/(tabs)/mis-reportes")}
        onTerminar={() => router.replace("/(tabs)")}
      />
    );
  }

  const buscandoGps = permitido !== false && !errorGps && !encontrada;
  const textoDonde = !punto
    ? buscandoGps
      ? "Buscando tu ubicación..."
      : permitido === false
        ? "No tenemos permiso para ver tu ubicación. Marcá el punto en el mapa."
        : "No pudimos encontrarte. Marcá el punto en el mapa."
    : direccion ?? "Punto marcado. Vamos a completar la calle cuando haya señal.";
  const distancia =
    punto && encontrada && puntoManual ? Math.round(distanciaMetros(ubicacion, punto)) : null;

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 0}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo} accessibilityRole="header">¿Qué pasa?</Text>
        {cargandoTipos ? (
          <ActivityIndicator size="large" color={COLORES.primario} />
        ) : errorTipos ? (
          <Pressable style={styles.boton} onPress={cargarCatalogos} accessibilityRole="button">
            <Text style={styles.botonTexto}>No se pudo cargar. Reintentar</Text>
          </Pressable>
        ) : (
          <View style={styles.grilla}>
            {tipos.map((tipo) => {
              const elegido = tipoId === tipo.id;
              return (
                <Pressable
                  key={tipo.id}
                  style={[styles.tipo, elegido && { borderColor: tipo.color, backgroundColor: `${tipo.color}1A` }]}
                  onPress={() => setTipoId(tipo.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: elegido }}
                  accessibilityLabel={tipo.nombre}
                >
                  <Icon name={tipo.icono as NombreIcono} size={32} color={elegido ? tipo.color : COLORES.textoSuave} />
                  <Text style={[styles.tipoTexto, elegido && styles.tipoTextoElegido]} numberOfLines={2}>
                    {tipo.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.titulo} accessibilityRole="header">Foto (obligatoria)</Text>
        {fotosUris.length > 0 && (
          <View style={styles.fotos}>
            {fotosUris.map((uri) => (
              <View key={uri} style={styles.fotoCaja}>
                <Image source={{ uri }} style={styles.foto} accessibilityLabel="Foto del problema" />
                <Pressable
                  style={styles.fotoQuitar}
                  onPress={() => quitarFoto(uri)}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar esta foto"
                >
                  <Icon name="close" size={26} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {fotosUris.length < MAX_FOTOS && (
          <View style={styles.fila}>
            <Pressable style={[styles.boton, styles.flexible]} onPress={abrirCamara} accessibilityRole="button">
              <Icon name="camera-outline" size={28} color={COLORES.texto} />
              <Text style={styles.botonTexto}>{fotosUris.length === 0 ? "Tomar foto" : "Otra foto"}</Text>
            </Pressable>
            <Pressable style={[styles.boton, styles.flexible]} onPress={abrirGaleria} accessibilityRole="button">
              <Icon name="images-outline" size={28} color={COLORES.texto} />
              <Text style={styles.botonTexto}>Galería</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.titulo} accessibilityRole="header">¿Dónde?</Text>
        <View style={styles.tarjeta}>
          {punto && <VistaPunto punto={punto} />}
          <Text style={styles.donde}>{textoDonde}</Text>
          {distancia !== null && <Text style={styles.ayuda}>A {distancia} m de vos</Text>}
          {punto && !puntoManual && !precisa && (
            <Text style={styles.ayuda}>Ubicación aproximada. Si no coincide, corregila en el mapa.</Text>
          )}
          {fueraDeLaCiudad && (
            <Text style={styles.aviso}>Ese punto queda fuera de Gualeguaychú. Corregilo en el mapa.</Text>
          )}
          <Pressable style={styles.boton} onPress={() => setMapaAbierto(true)} accessibilityRole="button">
            <Icon name="location-outline" size={28} color={COLORES.texto} />
            <Text style={styles.botonTexto}>{punto ? "Corregir en el mapa" : "Marcar en el mapa"}</Text>
          </Pressable>
        </View>

        <Text style={styles.titulo} accessibilityRole="header">Contanos</Text>
        <TextInput
          style={styles.descripcion}
          placeholder="Escribí qué pasa (opcional)"
          placeholderTextColor={COLORES.textoSuave}
          multiline
          maxLength={MAX_DESCRIPCION}
          value={descripcion}
          onChangeText={setDescripcion}
          accessibilityLabel="Descripción del problema"
        />
        <NotaDeVoz uri={audioUri} onCambiar={setAudioUri} onGrabando={setGrabandoAudio} />
      </ScrollView>

      {!hayInternet(red) && (
        <View style={styles.sinSenal}>
          <Icon name="cloud-offline-outline" size={24} color="#FFFFFF" />
          <Text style={styles.sinSenalTexto}>Sin señal. Tu reporte se guarda y se sube solo.</Text>
        </View>
      )}

      <View style={[styles.pie, { paddingBottom: margenes.bottom + 12 }]}>
        <Pressable
          style={[styles.enviar, guardando && styles.deshabilitado]}
          onPress={enviar}
          disabled={guardando}
          accessibilityRole="button"
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.enviarTexto}>Enviar</Text>
          )}
        </Pressable>
      </View>

      {camaraAbierta && (
        <CamaraReporte
          onCapturar={(uri) => {
            setCamaraAbierta(false);
            void agregarFoto(uri, "jpg");
          }}
          onCerrar={() => setCamaraAbierta(false)}
        />
      )}
      {mapaAbierto && (
        <SelectorPunto
          inicial={punto && !fueraDeLaCiudad ? punto : CENTRO_CIUDAD}
          onConfirmar={(elegido) => {
            setPuntoManual(elegido);
            setMapaAbierto(false);
          }}
          onCerrar={() => setMapaAbierto(false)}
        />
      )}
      {duplicados.length > 0 && tipoId && punto && (
        <AvisoDuplicados
          reportes={duplicados}
          origen={punto}
          tipoNombre={tipos.find((tipo) => tipo.id === tipoId)?.nombre ?? "este tipo"}
          sumandoId={sumandoId}
          onSumarse={(reporte) => void sumarse(reporte)}
          onEnviarIgual={() => {
            setDuplicados([]);
            void guardarReporte(tipoId, punto);
          }}
          onCerrar={() => setDuplicados([])}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  contenido: { padding: 16, paddingBottom: 28, gap: 12 },
  titulo: { marginTop: 8, fontSize: 22, fontWeight: "800", color: COLORES.texto },
  grilla: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tipo: {
    width: "23.5%",
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
  tipoTexto: { fontSize: 14, lineHeight: 17, fontWeight: "600", color: COLORES.texto, textAlign: "center" },
  tipoTextoElegido: { fontWeight: "800" },
  fila: { flexDirection: "row", gap: 10 },
  flexible: { flex: 1 },
  boton: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
  botonTexto: { fontSize: 18, fontWeight: "600", color: COLORES.texto },
  fotos: { flexDirection: "row", gap: 10 },
  fotoCaja: { flex: 1, maxWidth: "49%" },
  foto: { width: "100%", aspectRatio: 1, borderRadius: 14, backgroundColor: COLORES.linea },
  fotoQuitar: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  tarjeta: {
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORES.superficie,
  },
  donde: { fontSize: 19, fontWeight: "600", color: COLORES.texto },
  ayuda: { fontSize: 16, color: COLORES.textoSuave },
  aviso: { fontSize: 17, fontWeight: "600", color: "#B91C1C" },
  descripcion: {
    minHeight: 110,
    padding: 14,
    fontSize: 18,
    textAlignVertical: "top",
    color: COLORES.texto,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
  sinSenal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#4B5563",
  },
  sinSenalTexto: { flex: 1, fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  pie: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: COLORES.fondo },
  enviar: {
    minHeight: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORES.primario,
  },
  enviarTexto: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  deshabilitado: { opacity: 0.6 },
});
