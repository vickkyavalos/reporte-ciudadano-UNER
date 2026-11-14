import { useCallback } from "react";
import Icon from "@react-native-vector-icons/ionicons";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORES } from "@/constants/estados";
import { borrarArchivoLocal, guardarArchivoLocal } from "@/servicios/archivosLocales";

interface Props {
  uri: string | null;
  onCambiar: (uri: string | null) => void;
  onGrabando: (grabando: boolean) => void;
}

const CALIDAD_VOZ = { ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, bitRate: 64000 };

const tiempo = (ms: number) => {
  const segundos = Math.floor(ms / 1000);
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
};

export function NotaDeVoz({ uri, onCambiar, onGrabando }: Props) {
  const grabador = useAudioRecorder(CALIDAD_VOZ);
  const grabacion = useAudioRecorderState(grabador, 250);
  const reproductor = useAudioPlayer(uri ? { uri } : null);
  const reproduccion = useAudioPlayerStatus(reproductor);

  const prepararReproduccion = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: "doNotMix",
    });
  }, []);

  const empezar = async () => {
    try {
      const permiso = await requestRecordingPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Necesitamos el micrófono",
          "Para grabar la nota de voz hay que habilitar el micrófono. También podés escribir el problema.",
          [
            { text: "Ahora no", style: "cancel" },
            { text: "Abrir configuración", onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
      });
      await grabador.prepareToRecordAsync();
      grabador.record();
      onGrabando(true);
    } catch {
      Alert.alert("No se pudo grabar", "Probá de nuevo o escribí el problema.");
    }
  };

  const terminar = async () => {
    try {
      await grabador.stop();
      const uriGrabacion = grabador.uri;
      if (!uriGrabacion) {
        Alert.alert(
          "No se pudo guardar la grabación",
          "La grabación no generó un archivo. Probá de nuevo o escribí el problema.",
        );
        return;
      }
      onCambiar(await guardarArchivoLocal(uriGrabacion, "aud", "m4a"));
    } catch {
      Alert.alert("No se pudo guardar la grabación", "Probá de nuevo o escribí el problema.");
    } finally {
      onGrabando(false);
    }
  };

  const alternarReproduccion = async () => {
    if (reproduccion.playing) {
      reproductor.pause();
      return;
    }
    try {
      await prepararReproduccion();
      if (reproduccion.didJustFinish || reproduccion.currentTime >= reproduccion.duration) {
        await reproductor.seekTo(0);
      }
      reproductor.play();
    } catch {
      Alert.alert("No se pudo reproducir", "Volvé a intentarlo.");
    }
  };

  const borrar = () => {
    if (uri) borrarArchivoLocal(uri);
    onCambiar(null);
  };

  if (uri) {
    return (
      <View style={styles.fila}>
        <Pressable
          style={[
            styles.boton,
            styles.flexible,
            (!reproduccion.isLoaded || reproduccion.error) && styles.deshabilitado,
          ]}
          onPress={alternarReproduccion}
          disabled={!reproduccion.isLoaded || !!reproduccion.error}
          accessibilityRole="button"
        >
          <Icon name={reproduccion.playing ? "pause" : "play"} size={28} color={COLORES.texto} />
          <Text style={styles.botonTexto}>
            {reproduccion.error
              ? "Audio no disponible"
              : !reproduccion.isLoaded
                ? "Cargando audio..."
                : reproduccion.playing
                  ? "Pausar"
                  : "Escuchar audio"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.borrar}
          onPress={borrar}
          accessibilityRole="button"
          accessibilityLabel="Borrar la nota de voz"
        >
          <Icon name="trash-outline" size={28} color="#B91C1C" />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.boton, grabacion.isRecording && styles.grabando]}
      onPress={grabacion.isRecording ? terminar : empezar}
      accessibilityRole="button"
    >
      <Icon
        name={grabacion.isRecording ? "stop" : "mic-outline"}
        size={28}
        color={grabacion.isRecording ? "#FFFFFF" : COLORES.texto}
      />
      <Text style={[styles.botonTexto, grabacion.isRecording && styles.grabandoTexto]}>
        {grabacion.isRecording
          ? `Terminar de grabar (${tiempo(grabacion.durationMillis)})`
          : "Grabar nota de voz"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 10 },
  flexible: { flex: 1 },
  boton: {
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
  botonTexto: { fontSize: 18, fontWeight: "600", color: COLORES.texto },
  grabando: { backgroundColor: "#B91C1C", borderColor: "#B91C1C" },
  grabandoTexto: { color: "#FFFFFF" },
  deshabilitado: { opacity: 0.6 },
  borrar: {
    width: 60,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
});
