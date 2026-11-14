import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "@react-native-vector-icons/ionicons";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { COLORES } from "@/constants/estados";

interface Props {
  uri: string;
}
const tiempo = (segundos: number) => {
  const total = Math.max(0, Math.floor(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function ReproductorAudio({ uri }: Props) {
  const reproductor = useAudioPlayer({ uri });
  const estado = useAudioPlayerStatus(reproductor);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(
      () => undefined,
    );
  }, []);

  const alternar = () => {
    if (estado.playing) {
      reproductor.pause();
      return;
    }
    if (estado.didJustFinish || (estado.duration > 0 && estado.currentTime >= estado.duration)) {
      void reproductor.seekTo(0);
    }
    reproductor.play();
  };

  const texto = !estado.isLoaded
    ? "Cargando audio..."
    : estado.playing
      ? `Pausar (${tiempo(estado.currentTime)} / ${tiempo(estado.duration)})`
      : `Escuchar nota de voz${estado.duration > 0 ? ` (${tiempo(estado.duration)})` : ""}`;

  return (
    <View style={styles.fila}>
      <Pressable
        style={[styles.boton, !estado.isLoaded && styles.deshabilitado]}
        onPress={alternar}
        disabled={!estado.isLoaded}
        accessibilityRole="button"
        accessibilityLabel={estado.playing ? "Pausar la nota de voz" : "Escuchar la nota de voz"}
      >
        <Icon name={estado.playing ? "pause" : "play"} size={28} color={COLORES.texto} />
        <Text style={styles.texto}>{texto}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row" },
  boton: {
    flex: 1,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
  texto: { fontSize: 18, fontWeight: "600", color: COLORES.texto },
  deshabilitado: { opacity: 0.6 },
});
