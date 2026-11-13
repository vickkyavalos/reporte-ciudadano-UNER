import { useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { COLORES } from "@/constants/estados";

const ALTO_COLAPSADO = 150;

interface Props {
  children: ReactNode;
  alto: Animated.Value;
}

export function PanelInferior({ children, alto }: Props) {
  const { height } = useWindowDimensions();
  const [expandido, setExpandido] = useState(true);
  const altoExpandido = Math.round(height * 0.5);
  const inicializado = useRef(false);
  if (!inicializado.current) {
    alto.setValue(altoExpandido);
    inicializado.current = true;
  }

  const alternar = () => {
    const destino = expandido ? ALTO_COLAPSADO : altoExpandido;
    setExpandido(!expandido);
    Animated.timing(alto, { toValue: destino, duration: 220, useNativeDriver: false }).start();
  };

  return (
    <Animated.View style={[styles.panel, { height: alto }]}>
      <Pressable
        onPress={alternar}
        style={styles.zonaManija}
        accessibilityRole="button"
        accessibilityLabel={expandido ? "Bajar la lista" : "Subir la lista"}
      >
        <View style={styles.manija} />
      </Pressable>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: COLORES.superficie,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, overflow: "hidden",
    elevation: 12, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: -2 },
  },
  zonaManija: { alignItems: "center", paddingTop: 10, paddingBottom: 14 },
  manija: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#D1D5DB" },
});
