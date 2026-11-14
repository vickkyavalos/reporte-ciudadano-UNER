import { StyleSheet, Text, View } from "react-native";
import type { Coordenadas, Reporte, TipoDeReporte } from "@/tipos/reporte.interface";

interface Props {
  centro: Coordenadas;
  reportes: Reporte[];
  tipos: TipoDeReporte[];
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}

export function MapaReportes({ centro, reportes, tipos }: Props) {
  return (
    <View style={styles.container} accessibilityLabel="Mapa no disponible en el navegador">
      <View style={styles.roadHorizontal} />
      <View style={styles.roadVertical} />
      <View style={styles.card}>
        <Text style={styles.title}>Mapa disponible en la app móvil</Text>
        <Text style={styles.message}>
          Estás viendo reportes cerca de {centro.latitud.toFixed(3)}, {centro.longitud.toFixed(3)}.
          Abrí la aplicación móvil para verlos en el mapa.
        </Text>
        <Text style={styles.count}>
          {reportes.length} {reportes.length === 1 ? "reporte" : "reportes"} en tu zona
        </Text>
        {reportes.length > 0 && (
          <Text style={styles.categories}>
            {reportes
              .map((reporte) => tipos.find((tipo) => tipo.id === reporte.tipoId)?.nombre)
              .filter((nombre): nombre is string => Boolean(nombre))
              .slice(0, 3)
              .join(" · ")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EFEA",
  },
  roadHorizontal: {
    position: "absolute",
    top: "38%",
    left: "-10%",
    width: "120%",
    height: 42,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-12deg" }],
  },
  roadVertical: {
    position: "absolute",
    top: "-10%",
    left: "68%",
    width: 34,
    height: "120%",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "18deg" }],
  },
  card: {
    maxWidth: 360,
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1A202C", marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 22, color: "#4A5568" },
  count: { marginTop: 14, fontSize: 14, fontWeight: "600", color: "#1A202C" },
  categories: { marginTop: 4, fontSize: 13, color: "#718096" },
});
