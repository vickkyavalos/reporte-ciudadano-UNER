import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Coordenadas } from "@/tipos/reporte.interface";

interface Props {
  inicial: Coordenadas;
  onConfirmar: (punto: Coordenadas) => void;
  onCerrar: () => void;
}

export function VistaPunto(_props: { punto: Coordenadas }) {
  return null;
}

export function SelectorPunto({ inicial, onConfirmar, onCerrar }: Props) {
  return (
    <Modal onRequestClose={onCerrar}>
      <View style={styles.contenedor}>
        <Text style={styles.texto}>El mapa para corregir el punto está disponible en la app móvil.</Text>
        <Pressable style={styles.boton} onPress={() => onConfirmar(inicial)} accessibilityRole="button">
          <Text style={styles.botonTexto}>Volver</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  texto: { fontSize: 18, textAlign: "center" },
  boton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: "#111827" },
  botonTexto: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
});
