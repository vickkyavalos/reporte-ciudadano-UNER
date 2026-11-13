import { Alert, Pressable, StyleSheet, Text } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useAuth } from "@/providers/AuthProvider";
import { COLORES } from "@/constants/estados";

export function BotonCerrarSesion() {
  const { salir } = useAuth();

  const confirmar = () => {
    Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => void salir() },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      onPress={confirmar}
      style={styles.boton}
    >
      <Ionicons name="log-out-outline" size={22} color={COLORES.texto} />
      <Text style={styles.texto}>Salir</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: COLORES.fondo,
  },
  texto: { fontSize: 15, fontWeight: "600", color: COLORES.texto },
});