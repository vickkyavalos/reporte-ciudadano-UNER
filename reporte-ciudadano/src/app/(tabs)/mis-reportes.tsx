
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";

import { TarjetaMiReporte } from "@/components/reportes/tarjeta-mi-reporte";
import { COLORES } from "@/constants/estados";
import {
  obtenerMisReportes,
  obtenerTipos,
} from "@/servicios/reportesService";
import type {
  Reporte,
  TipoDeReporte,
} from "@/tipos/reporte.interface";

const AUTOR_PRUEBA = "usr-084";

export default function MisReportes() {
  const router = useRouter();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const [resultado, listaTipos] = await Promise.all([
        obtenerMisReportes(AUTOR_PRUEBA),
        obtenerTipos(),
      ]);

      setReportes(resultado.datos);
      setTipos(listaTipos);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos cargar tus reportes."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Mis Reportes</Text>
        <Text style={styles.subtitulo}>
          Consultá el estado de tus reclamos
        </Text>
      </View>

      {cargando ? (
        <ActivityIndicator
          size="large"
          color={COLORES.primario}
          style={styles.centrado}
        />
      ) : error ? (
        <View style={styles.vacio}>
          <Text style={styles.mensaje}>{error}</Text>
          <Pressable style={styles.boton} onPress={cargar}>
            <Text style={styles.botonTexto}>Reintentar</Text>
          </Pressable>
        </View>
      ) : reportes.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={COLORES.textoSuave}
          />
          <Text style={styles.tituloVacio}>
            Todavía no tenés reportes
          </Text>
          <Text style={styles.mensaje}>
            Cuando hagas un reclamo, vas a poder consultar acá su estado.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TarjetaMiReporte
              reporte={item}
              titulo={`${
                tipos.find((t) => t.id === item.tipoId)?.nombre ?? "Reporte"
              } en ${item.direccion}`}
                fecha={new Date(item.creadoEn).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "America/Argentina/Buenos_Aires",
                })}
                fotoUrl={
                  item.fotos.find((foto) => foto.momento === "problema")?.url ??
                  item.fotos[0]?.url ??
                  null
                }
                onPress={() =>
                  router.push({
                    pathname: "/reportes/[id]",
                    params: { id: item.id },
                  })
                }
              />
            )}
          
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  encabezado: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: COLORES.superficie,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORES.texto,
  },
  subtitulo: {
    marginTop: 6,
    fontSize: 14,
    color: COLORES.textoSuave,
  },
  lista: {
    padding: 16,
    paddingBottom: 28,
  },
  centrado: {
    marginTop: 40,
  },
  vacio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  tituloVacio: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORES.texto,
    textAlign: "center",
  },
  mensaje: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORES.textoSuave,
    textAlign: "center",
  },
  boton: {
    minHeight: 46,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: COLORES.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
