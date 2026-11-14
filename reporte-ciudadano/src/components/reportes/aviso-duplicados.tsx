import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORES, ESTADOS } from "@/constants/estados";
import type { Coordenadas, Reporte } from "@/tipos/reporte.interface";
import { distanciaMetros } from "@/utils/formato";

interface Props {
  reportes: Reporte[];
  origen: Coordenadas;
  tipoNombre: string;
  sumandoId: string | null;
  onSumarse: (reporte: Reporte) => void;
  onEnviarIgual: () => void;
  onCerrar: () => void;
}

export function AvisoDuplicados({
  reportes,
  origen,
  tipoNombre,
  sumandoId,
  onSumarse,
  onEnviarIgual,
  onCerrar,
}: Props) {
  const margenes = useSafeAreaInsets();
  const ocupado = sumandoId !== null;

  return (
    <Modal transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.hoja, { paddingBottom: margenes.bottom + 16 }]}>
          <Text style={styles.titulo} accessibilityRole="header">¿Es alguno de estos?</Text>
          <Text style={styles.subtitulo}>
            {reportes.length === 1
              ? `Ya hay un reporte de ${tipoNombre.toLowerCase()} a menos de 50 m.`
              : `Ya hay ${reportes.length} reportes de ${tipoNombre.toLowerCase()} a menos de 50 m.`}{" "}
            Si es el mismo problema, sumate: así sube en la lista de Obras.
          </Text>

          <ScrollView style={styles.lista} contentContainerStyle={styles.listaContenido}>
            {reportes.map((reporte) => {
              const foto = reporte.fotos.find((actual) => actual.momento === "problema") ?? reporte.fotos[0];
              const metros = Math.round(distanciaMetros(origen, reporte.coordenadas));
              return (
                <View key={reporte.id} style={styles.tarjeta}>
                  <View style={styles.fila}>
                    {foto ? (
                      <Image source={{ uri: foto.url }} style={styles.foto} accessibilityLabel="Foto del reporte" />
                    ) : (
                      <View style={[styles.foto, styles.sinFoto]} />
                    )}
                    <View style={styles.datos}>
                      <Text style={styles.direccion} numberOfLines={2}>{reporte.direccion}</Text>
                      <Text style={styles.detalle}>
                        A {metros} m · {ESTADOS[reporte.estado].etiqueta}
                      </Text>
                      <Text style={styles.detalle}>
                        {reporte.adhesiones === 1
                          ? "1 vecino se sumó"
                          : `${reporte.adhesiones} vecinos se sumaron`}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.sumarse, ocupado && styles.deshabilitado]}
                    onPress={() => onSumarse(reporte)}
                    disabled={ocupado}
                    accessibilityRole="button"
                    accessibilityLabel={`Es el mismo, sumarme al reporte de ${reporte.direccion}`}
                  >
                    {sumandoId === reporte.id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sumarseTexto}>Es el mismo, sumarme</Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            style={[styles.enviarIgual, ocupado && styles.deshabilitado]}
            onPress={onEnviarIgual}
            disabled={ocupado}
            accessibilityRole="button"
          >
            <Text style={styles.enviarIgualTexto}>No, es otro problema: enviar igual</Text>
          </Pressable>
          <Pressable style={styles.volver} onPress={onCerrar} disabled={ocupado} accessibilityRole="button">
            <Text style={styles.volverTexto}>Volver al reporte</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  hoja: {
    maxHeight: "88%",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: COLORES.fondo,
  },
  titulo: { fontSize: 24, fontWeight: "800", color: COLORES.texto },
  subtitulo: { fontSize: 17, lineHeight: 24, color: COLORES.texto },
  lista: { flexGrow: 0 },
  listaContenido: { gap: 10 },
  tarjeta: { gap: 12, padding: 12, borderRadius: 14, backgroundColor: COLORES.superficie },
  fila: { flexDirection: "row", gap: 12 },
  foto: { width: 76, height: 76, borderRadius: 10, backgroundColor: COLORES.linea },
  sinFoto: { borderWidth: 1, borderColor: COLORES.linea },
  datos: { flex: 1, gap: 4 },
  direccion: { fontSize: 18, fontWeight: "700", color: COLORES.texto },
  detalle: { fontSize: 16, color: COLORES.textoSuave },
  sumarse: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORES.primario,
  },
  sumarseTexto: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  enviarIgual: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
  enviarIgualTexto: { fontSize: 18, fontWeight: "600", color: COLORES.texto, textAlign: "center" },
  volver: { minHeight: 52, alignItems: "center", justifyContent: "center" },
  volverTexto: { fontSize: 17, fontWeight: "600", color: COLORES.textoSuave },
  deshabilitado: { opacity: 0.6 },
});
