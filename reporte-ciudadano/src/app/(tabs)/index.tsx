import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapaReportes } from "@/components/map/mapa-vista";
import { ReporteItem } from "@/components/reportes/reporte-item";
import { PanelInferior } from "@/components/ui/barra-inicio";
import { COLORES } from "@/constants/estados";
import { useUbicacion } from "@/hooks/use-ubicacion";
import { obtenerReportesCercanos, obtenerTipos, sumarseAReporte } from "@/servicios/reportes";
import type { Reporte } from "@/tipos/reporte.interface";
import type { TipoDeReporte } from "@/tipos/reporte.interface";
import { useAuth } from "@/providers/AuthProvider";
type Carga = "cargando" | "ok" | "error";

export default function ReportesCercanos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ubicacion } = useUbicacion();
  const { salir } = useAuth();

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [carga, setCarga] = useState<Carga>("cargando");
  const [mensajeError, setMensajeError] = useState("");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [sumados, setSumados] = useState<Set<string>>(new Set());
  const [sumando, setSumando] = useState<string | null>(null);
  const altoPanel = useRef(new Animated.Value(0)).current;
  const lista = useRef<FlatList<Reporte>>(null);

  const cargar = useCallback(async () => {
    setCarga("cargando");
    try {
      const [t, r] = await Promise.all([obtenerTipos(), obtenerReportesCercanos(ubicacion)]);
      setTipos(t);
      setReportes(r.datos);
      setCarga("ok");
    } catch (e) {
      setMensajeError(e instanceof Error ? e.message : "Algo salió mal.");
      setCarga("error");
    }
  }, [ubicacion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const sumarme = async (id: string) => {
    setSumando(id);
    try {
      const actualizado = await sumarseAReporte(id);
      setReportes((prev) => prev.map((r) => (r.id === id ? actualizado : r)));
      setSumados((prev) => new Set(prev).add(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setMensajeError(e instanceof Error ? e.message : "No pudimos sumarte.");
      setCarga("error");
    } finally {
      setSumando(null);
    }
  };

  const seleccionarDesdeMapa = (id: string) => {
    setSeleccionadoId(id);
    const indice = reportes.findIndex((r) => r.id === id);
    if (indice >= 0) lista.current?.scrollToIndex({ index: indice, animated: true });
  };

  return (
    <View style={styles.pantalla}>
      <MapaReportes
        centro={ubicacion}
        reportes={reportes}
        tipos={tipos}
        seleccionadoId={seleccionadoId}
        onSeleccionar={seleccionarDesdeMapa}
      />

      {/* encabezado */}
      <View style={[styles.encabezado, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.titulo}>Reportes Cercanos</Text>
        <Pressable
          style={styles.perfil}
          accessibilityRole="button"
          accessibilityLabel="Mi perfil"
          onPress={() => router.push("/login" as Href)}
        >
          <Ionicons name="person-outline" size={22} color={COLORES.texto} />
        </Pressable>
      </View>

      {/* Btn */}
      <Animated.View style={[styles.fab, { bottom: Animated.add(altoPanel, 16) }]}>
        <Pressable
          style={styles.fabBoton}
          accessibilityRole="button"
          accessibilityLabel="Crear un reporte nuevo"
          onPress={() => router.push("/reportes/nuevo" as Href)}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <PanelInferior alto={altoPanel}>
        <Text style={styles.subtitulo}>En tu zona</Text>

        {carga === "cargando" && <ActivityIndicator size="large" style={styles.centrado} color={COLORES.primario} />}

        {carga === "error" && (
          <View style={styles.centrado}>
            <Text style={styles.mensaje}>{mensajeError}</Text>
            <Pressable style={styles.reintentar} onPress={cargar} accessibilityRole="button">
              <Text style={styles.reintentarTexto}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {carga === "ok" && reportes.length === 0 && (
          <Text style={[styles.mensaje, styles.centrado]}>
            No hay reportes cerca tuyo. Si ves un problema, tocá el botón + para avisar.
          </Text>
        )}

        {carga === "ok" && reportes.length > 0 && (
          <FlatList
            ref={lista}
            data={reportes}
            keyExtractor={(r) => r.id}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item }) => (
              <ReporteItem
                reporte={item}
                tipo={tipos.find((t) => t.id === item.tipoId)}
                seleccionado={item.id === seleccionadoId}
                yaSumado={sumados.has(item.id)}
                sumando={sumando === item.id}
                onPress={() => setSeleccionadoId(item.id)}
                onSumarme={() => sumarme(item.id)}
              />
            )}
          />
        )}
      </PanelInferior>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORES.fondo },
  encabezado: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12, backgroundColor: COLORES.superficie,
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  titulo: { fontSize: 22, fontWeight: "700", color: COLORES.texto },
  perfil: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORES.fondo, alignItems: "center", justifyContent: "center" },
  subtitulo: { fontSize: 20, fontWeight: "700", color: COLORES.texto, marginBottom: 6 },
  fab: { position: "absolute", right: 20 },
  fabBoton: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORES.primario, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  centrado: { marginTop: 24, alignItems: "center" },
  mensaje: { fontSize: 17, color: COLORES.textoSuave, textAlign: "center", lineHeight: 24 },
  reintentar: { marginTop: 16, minHeight: 48, paddingHorizontal: 24, borderRadius: 10, borderWidth: 2, borderColor: COLORES.primario, alignItems: "center", justifyContent: "center" },
  reintentarTexto: { fontSize: 16, fontWeight: "700", color: COLORES.primario },
});
