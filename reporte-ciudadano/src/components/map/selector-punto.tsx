import Constants, { ExecutionEnvironment } from "expo-constants";
import { useNetworkState } from "expo-network";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORES } from "@/constants/estados";
import type { Coordenadas } from "@/tipos/reporte.interface";

interface Props {
  inicial: Coordenadas;
  onConfirmar: (punto: Coordenadas) => void;
  onCerrar: () => void;
}

const DELTA = 0.003;

const aPunto = (c: { latitude: number; longitude: number }): Coordenadas => ({
  latitud: c.latitude,
  longitud: c.longitude,
});

const mapaDisponible =
  Platform.OS !== "android" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants.expoConfig?.plugins ?? []).some(
    (plugin) =>
      Array.isArray(plugin) &&
      plugin[0] === "react-native-maps" &&
      Boolean((plugin[1] as { androidGoogleMapsApiKey?: string } | undefined)?.androidGoogleMapsApiKey),
  );

export function VistaPunto({ punto }: { punto: Coordenadas }) {
  if (!mapaDisponible) return null;
  const posicion = { latitude: punto.latitud, longitude: punto.longitud };
  return (
    <View style={styles.vista} pointerEvents="none" accessibilityLabel="Mapa con el punto del problema">
      <MapView
        style={styles.mapa}
        region={{ ...posicion, latitudeDelta: DELTA, longitudeDelta: DELTA }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker coordinate={posicion} />
      </MapView>
    </View>
  );
}
export function SelectorPunto({ inicial, onConfirmar, onCerrar }: Props) {
  const [punto, setPunto] = useState(inicial);
  const red = useNetworkState();
  const margenes = useSafeAreaInsets();

  if (!mapaDisponible) {
    return (
      <Modal animationType="slide" onRequestClose={onCerrar}>
        <View style={[styles.contenedor, styles.sinMapa, { paddingBottom: margenes.bottom + 16 }]}>
          <Text style={styles.ayudaTexto}>
            El mapa no está disponible en esta versión de la app. Podés usar el punto que marcó el
            GPS.
          </Text>
          <View style={styles.acciones}>
            <Pressable style={styles.secundario} onPress={onCerrar} accessibilityRole="button">
              <Text style={styles.secundarioTexto}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primario} onPress={() => onConfirmar(inicial)} accessibilityRole="button">
              <Text style={styles.primarioTexto}>Usar ese punto</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.contenedor}>
        <MapView
          style={styles.mapa}
          initialRegion={{
            latitude: inicial.latitud,
            longitude: inicial.longitud,
            latitudeDelta: DELTA,
            longitudeDelta: DELTA,
          }}
          onPress={(evento) => setPunto(aPunto(evento.nativeEvent.coordinate))}
        >
          <Marker
            draggable
            coordinate={{ latitude: punto.latitud, longitude: punto.longitud }}
            onDragEnd={(evento) => setPunto(aPunto(evento.nativeEvent.coordinate))}
          />
        </MapView>

        <View style={[styles.ayuda, { top: margenes.top + 12 }]}>
          <Text style={styles.ayudaTexto}>
            {red.isConnected === false
              ? "Sin señal el mapa puede verse vacío, pero igual podés mover el pin."
              : "Arrastrá el pin o tocá el mapa donde está el problema."}
          </Text>
        </View>

        <View style={[styles.acciones, { paddingBottom: margenes.bottom + 16 }]}>
          <Pressable style={styles.secundario} onPress={onCerrar} accessibilityRole="button">
            <Text style={styles.secundarioTexto}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={styles.primario}
            onPress={() => onConfirmar(punto)}
            accessibilityRole="button"
          >
            <Text style={styles.primarioTexto}>Usar este punto</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.superficie },
  mapa: { flex: 1 },
  sinMapa: { justifyContent: "center", gap: 24, paddingHorizontal: 16 },
  vista: { height: 150, borderRadius: 12, overflow: "hidden" },
  ayuda: {
    position: "absolute",
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORES.superficie,
    elevation: 4,
  },
  ayudaTexto: { fontSize: 18, fontWeight: "600", color: COLORES.texto, textAlign: "center" },
  acciones: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  secundario: {
    flex: 1,
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORES.linea,
    alignItems: "center",
    justifyContent: "center",
  },
  secundarioTexto: { fontSize: 18, fontWeight: "600", color: COLORES.texto },
  primario: {
    flex: 2,
    minHeight: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORES.primario,
  },
  primarioTexto: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
});
