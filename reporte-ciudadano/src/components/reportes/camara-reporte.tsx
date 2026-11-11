import Icon from "@react-native-vector-icons/ionicons";
import { CameraView } from "expo-camera";
import { useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  onCapturar: (uri: string) => void;
  onCerrar: () => void;
}

export function CamaraReporte({ onCapturar, onCerrar }: Props) {
  const camara = useRef<CameraView>(null);
  const [capturando, setCapturando] = useState(false);
  const margenes = useSafeAreaInsets();

  const capturar = async () => {
    if (!camara.current || capturando) return;
    setCapturando(true);
    try {
      const foto = await camara.current.takePictureAsync({ quality: 0.6 });
      if (foto) onCapturar(foto.uri);
    } catch {
      Alert.alert("No se pudo sacar la foto", "Probá de nuevo, por favor.");
    } finally {
      setCapturando(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.contenedor}>
        <CameraView ref={camara} style={StyleSheet.absoluteFill} facing="back" />
        <Pressable
          style={[styles.cerrar, { top: margenes.top + 16 }]}
          onPress={onCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar la cámara"
        >
          <Icon name="close" size={36} color="#FFFFFF" />
        </Pressable>
        <View style={[styles.controles, { bottom: margenes.bottom + 32 }]}>
          <Pressable
            style={[styles.disparador, capturando && styles.deshabilitado]}
            onPress={capturar}
            disabled={capturando}
            accessibilityRole="button"
            accessibilityLabel="Sacar la foto"
          >
            <View style={styles.disparadorInterior} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#000000" },
  cerrar: {
    position: "absolute",
    left: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  controles: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  disparador: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  disparadorInterior: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#FFFFFF" },
  deshabilitado: { opacity: 0.5 },
});
