import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useAuth } from "@/providers/AuthProvider";
import {
  obtenerReportePorId,
  obtenerTipos,
} from "@/servicios/reportes";
import type {
  Reporte,
  TipoDeReporte,
} from "@/tipos/reporte.interface";
import { EstadoBadge } from "@/components/ui/text-estado";

export default function DetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuth();

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarQR, setMostrarQR] = useState(false);

  const esOperador = usuario?.rol === "operador";
  const esVecino = usuario?.rol === "vecino";
  const esAutor = !!reporte && reporte.autorId === usuario?.id;

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
      void Promise.resolve().then(() => {
        if (activo) {
          setError("No se recibió el identificador del reclamo.");
          setCargando(false);
        }
      });
    }

    return () => {
      activo = false;
    };
  }, [id]);

  const tipo = tipos.find((item) => item.id === reporte?.tipoId);
  const foto =
    reporte?.fotos.find((item) => item.momento === "problema") ??
    reporte?.fotos[0];
  const fotoArreglo = reporte?.fotos.find((item) => item.momento === "arreglo");

  const accionPendiente = (nombre: string) =>
    Alert.alert(nombre, "Esta acción todavía no está conectada.");

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

          {/* VECINO AUTOR*/}
          {esVecino && esAutor && (
            <View style={styles.bloque}>
              <Pressable
                style={styles.boton}
                onPress={() => setMostrarQR((v) => !v)}
              >
                <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                <Text style={styles.botonTexto}>
                  {mostrarQR ? "Ocultar código" : "Mostrar código QR"}
                </Text>
              </Pressable>

              {mostrarQR && (
                <View style={styles.qrCaja}>
                  {/*componente QR  */}
                  <Text style={styles.qrCodigo}>{reporte.codigo}</Text>
                  <Text style={styles.qrAyuda}>
                    Mostrá este código en el mostrador.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* OPERADOR*/}
          {esOperador && (
            <View style={styles.bloque}>
              <Text style={styles.etiquetaSeccion}>Acciones del operador</Text>

              <Pressable
                style={styles.botonOperador}
                onPress={() => accionPendiente("Cambiar estado")}
              >
                <Ionicons name="swap-horizontal-outline" size={20} color="#222" />
                <Text style={styles.botonOperadorTexto}>Cambiar estado</Text>
              </Pressable>

              <Pressable
                style={styles.botonOperador}
                onPress={() => accionPendiente("Asignar cuadrilla")}
              >
                <Ionicons name="people-outline" size={20} color="#222" />
                <Text style={styles.botonOperadorTexto}>Asignar cuadrilla</Text>
              </Pressable>

              <Pressable
                style={styles.botonOperador}
                onPress={() => accionPendiente("Marcar como duplicado")}
              >
                <Ionicons name="copy-outline" size={20} color="#222" />
                <Text style={styles.botonOperadorTexto}>Marcar como duplicado</Text>
              </Pressable>

              <Pressable
                style={styles.botonOperador}
                onPress={() => accionPendiente("Subir foto del arreglo")}
              >
                <Ionicons name="camera-outline" size={20} color="#222" />
                <Text style={styles.botonOperadorTexto}>Subir foto del arreglo</Text>
              </Pressable>
            </View>
          )}

          {(reporte.estado === "resuelto" || reporte.estado === "rechazado") && (
            <View style={styles.cierre}>
              <Text style={styles.etiqueta}>Cierre del reclamo</Text>
              {fotoArreglo?.url && (
                <Image source={{ uri: fotoArreglo.url }} style={styles.foto} />
              )}
              <Text style={styles.texto}>
                {reporte.comentarioCierre?.trim() || "Sin comentario de cierre."}
              </Text>
            </View>
          )}

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
  cierre: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
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

  // --- Bloques por rol ---
  bloque: {
    marginBottom: 18,
    gap: 10,
  },
  etiquetaSeccion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  boton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    backgroundColor: "#1F6FEB",
  },
  botonTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  qrCaja: {
    alignItems: "center",
    padding: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  qrCodigo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  qrAyuda: {
    fontSize: 14,
    color: "#666",
  },
  botonOperador: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  botonOperadorTexto: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },
});
