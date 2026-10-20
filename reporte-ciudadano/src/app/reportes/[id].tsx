
// prueba 

import { useEffect, useState } from "react";
import {
ActivityIndicator,
Image,
ScrollView,
StyleSheet,
Text,
View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";

import {
obtenerReportePorId,
obtenerTipos,
} from "@/servicios/reportesService";
import type {
Reporte,
TipoDeReporte,
} from "@/tipos/reporte.interface";
import { EstadoBadge } from "@/components/ui/text-estado";

export default function DetalleReporte() {
const { id } = useLocalSearchParams<{ id: string }>();
const router = useRouter();

const [reporte, setReporte] = useState<Reporte | null>(null);
const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
let activo = true;

async function cargarDetalle() {
  try {
    setCargando(true);
    setError("");

    const [resultado, listaTipos] = await Promise.all([
      obtenerReportePorId(id),
      obtenerTipos(),
    ]);

    if (activo) {
      setReporte(resultado);
      setTipos(listaTipos);
    }
  } catch (e) {
    if (activo) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo cargar el detalle del reclamo."
      );
    }
  } finally {
    if (activo) setCargando(false);
  }
}

if (id) {
  cargarDetalle();
} else {
  setError("No se recibió el identificador del reclamo.");
  setCargando(false);
}

return () => {
  activo = false;
};

}, [id]);

const tipo = tipos.find((item) => item.id === reporte?.tipoId);
const foto =
reporte?.fotos.find((item) => item.momento === "problema") ??
reporte?.fotos[0];

return (
<View style={styles.pantalla}>

  {cargando ? (
    <ActivityIndicator size="large" style={styles.cargando} />
  ) : error ? (
    <View style={styles.cargando}>
      <Text style={styles.error}>{error}</Text>
    </View>
  ) : reporte ? (
    <ScrollView contentContainerStyle={styles.contenido}>
      {foto?.url ? (
        <Image source={{ uri: foto.url }} style={styles.foto} />
      ) : (
        <View style={styles.sinFoto}>
          <Ionicons name="image-outline" size={40} color="#777" />
          <Text>Sin foto disponible</Text>
        </View>
      )}

      <Text style={styles.codigo}>{reporte.codigo}</Text>

      <Text style={styles.nombre}>
        {tipo?.nombre ?? "Reporte"} en {reporte.direccion}
      </Text>

      <View style={styles.estado}>
        <EstadoBadge estado={reporte.estado} />
      </View>

      <Text style={styles.etiqueta}>Descripción</Text>
      <Text style={styles.texto}>
        {reporte.descripcion?.trim() || "Sin descripción disponible."}
      </Text>

      <Text style={styles.etiqueta}>Dirección</Text>
      <Text style={styles.texto}>{reporte.direccion}</Text>

      <Text style={styles.etiqueta}>Fecha del reclamo</Text>
      <Text style={styles.texto}>
        {new Date(reporte.creadoEn).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "America/Argentina/Buenos_Aires",
        })}
      </Text>

      <Text style={styles.etiqueta}>Adhesiones</Text>
      <Text style={styles.texto}>
        {reporte.adhesiones}{" "}
        {reporte.adhesiones === 1 ? "persona se sumó" : "personas se sumaron"}
      </Text>
    </ScrollView>
  ) : null}
</View>

);
}

const styles = StyleSheet.create({
pantalla: {
flex: 1,
backgroundColor: "#F7F7F7",
},
encabezado: {
flexDirection: "row",
alignItems: "center",
gap: 16,
padding: 18,
backgroundColor: "#FFFFFF",
borderBottomWidth: 1,
borderBottomColor: "#E5E5E5",
},
titulo: {
fontSize: 20,
fontWeight: "600",
color: "#222",
},
contenido: {
padding: 20,
paddingBottom: 40,
},
foto: {
width: "100%",
height: 220,
borderRadius: 12,
marginBottom: 18,
backgroundColor: "#E5E5E5",
},
sinFoto: {
height: 140,
alignItems: "center",
justifyContent: "center",
gap: 8,
borderRadius: 12,
backgroundColor: "#EAEAEA",
marginBottom: 18,
},
codigo: {
fontSize: 13,
color: "#666",
marginBottom: 6,
},
nombre: {
fontSize: 23,
fontWeight: "700",
color: "#222",
marginBottom: 12,
},
estado: {
alignSelf: "flex-start",
marginBottom: 18,
},
etiqueta: {
fontSize: 15,
fontWeight: "700",
color: "#333",
marginTop: 16,
marginBottom: 5,
},
texto: {
fontSize: 16,
lineHeight: 23,
color: "#555",
},
cargando: {
flex: 1,
alignItems: "center",
justifyContent: "center",
padding: 24,
},
error: {
color: "#B42318",
textAlign: "center",
fontSize: 16,
},
});