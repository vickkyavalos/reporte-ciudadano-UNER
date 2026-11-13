import { StyleSheet, Text, View } from "react-native";
import { ESTADOS } from "@/constants/estados";
import type { EstadoReporte } from "@/tipos/reporte.interface";

export function EstadoBadge({ estado }: { estado: EstadoReporte }) {
  const e = ESTADOS[estado];
  return (
    <View style={[styles.badge, { backgroundColor: e.fondo, borderColor: e.borde }]}>
      <Text style={[styles.texto, { color: e.texto }]}>{e.etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  texto: { fontSize: 13, fontWeight: "600" },
});
