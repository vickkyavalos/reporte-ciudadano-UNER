import Constants, { ExecutionEnvironment } from "expo-constants";
import { useNetworkState } from "expo-network";
import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
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

const mapaNativoDisponible =
  Platform.OS !== "android" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants.expoConfig?.plugins ?? []).some(
    (plugin) =>
      Array.isArray(plugin) &&
      plugin[0] === "react-native-maps" &&
      Boolean((plugin[1] as { androidGoogleMapsApiKey?: string } | undefined)?.androidGoogleMapsApiKey),
  );

const crearHtml = (punto: Coordenadas, interactivo: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #e5e5e5; }
    .pin { width: 26px; height: 26px; border-radius: 50%; background: #C1440E;
           border: 4px solid #fff; box-shadow: 0 1px 6px rgba(0,0,0,.5); box-sizing: border-box; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  const interactivo = ${interactivo};
  const map = L.map('map', {
    zoomControl: interactivo,
    dragging: interactivo,
    touchZoom: interactivo,
    doubleClickZoom: interactivo,
    scrollWheelZoom: interactivo,
    boxZoom: false,
    keyboard: false,
    attributionControl: false
  }).setView([${punto.latitud}, ${punto.longitud}], 17);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  const icono = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
  const marcador = L.marker([${punto.latitud}, ${punto.longitud}], { icon: icono, draggable: interactivo }).addTo(map);

  function avisar() {
    const p = marcador.getLatLng();
    window.ReactNativeWebView.postMessage(JSON.stringify({ latitud: p.lat, longitud: p.lng }));
  }
  if (interactivo) {
    marcador.on('dragend', avisar);
    map.on('click', function (e) { marcador.setLatLng(e.latlng); avisar(); });
  }
</script>
</body>
</html>`;

function MapaLeaflet({
  punto,
  interactivo,
  onPunto,
}: {
  punto: Coordenadas;
  interactivo: boolean;
  onPunto?: (punto: Coordenadas) => void;
}) {
  const html = useMemo(
    () => crearHtml(punto, interactivo),
    [punto.latitud, punto.longitud, interactivo],
  );

  const alRecibir = (evento: WebViewMessageEvent) => {
    try {
      const { latitud, longitud } = JSON.parse(evento.nativeEvent.data);
      if (typeof latitud === "number" && typeof longitud === "number") {
        onPunto?.({ latitud, longitud });
      }
    } catch {

    }
  };

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html, baseUrl: "https://localhost" }}
      onMessage={alRecibir}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      style={styles.mapa}
    />
  );
}


export function VistaPunto({ punto }: { punto: Coordenadas }) {
  if (!mapaNativoDisponible) {
    return (
      <View style={styles.vista} pointerEvents="none" accessibilityLabel="Mapa con el punto del problema">
        <MapaLeaflet punto={punto} interactivo={false} />
      </View>
    );
  }
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

  return (
    <Modal animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.contenedor}>
        {mapaNativoDisponible ? (
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
        ) : (
          <MapaLeaflet punto={inicial} interactivo onPunto={setPunto} />
        )}

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
