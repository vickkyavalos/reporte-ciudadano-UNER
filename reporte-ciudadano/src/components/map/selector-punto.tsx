import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORES } from "@/constants/estados";
import type { Coordenadas } from "@/tipos/reporte.interface";

interface Props {
  inicial: Coordenadas;
  onConfirmar: (punto: Coordenadas) => void;
  onCerrar: () => void;
}

const ZOOM = 17;

const crearHtml = (punto: Coordenadas, interactivo: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #e5e5e5; }
    .aviso { margin: 0; padding: 20px; font: 600 17px sans-serif; color: #333; text-align: center; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  function enviar(obj) {
    window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }

  if (!window.L) {
    document.getElementById('map').innerHTML =
      '<p class="aviso">Sin conexión no podemos mostrar el mapa.</p>';
    enviar({ tipo: 'sinMapa' });
  } else {
    const inicial = [${punto.latitud}, ${punto.longitud}];
    const interactivo = ${interactivo};
    const map = L.map('map', {
      zoomControl: interactivo,
      dragging: interactivo,
      touchZoom: interactivo,
      doubleClickZoom: interactivo,
      scrollWheelZoom: interactivo,
      boxZoom: interactivo,
      keyboard: interactivo
    }).setView(inicial, ${ZOOM});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const pin = L.marker(inicial, { draggable: interactivo, interactive: interactivo }).addTo(map);

    function elegir(latlng) {
      pin.setLatLng(latlng);
      enviar({ tipo: 'punto', latitud: latlng.lat, longitud: latlng.lng });
    }

    if (interactivo) {
      map.on('click', function (e) { elegir(e.latlng); });
      pin.on('dragend', function () { elegir(pin.getLatLng()); });
    }

    window.mover = function (latitud, longitud) {
      pin.setLatLng([latitud, longitud]);
      map.setView([latitud, longitud], map.getZoom(), { animate: false });
    };
  }
</script>
</body>
</html>`;

const moverPin = (web: WebView | null, latitud: number, longitud: number) => {
  web?.injectJavaScript(`window.mover && window.mover(${latitud}, ${longitud}); true;`);
};

export function VistaPunto({ punto }: { punto: Coordenadas }) {
  const { latitud, longitud } = punto;
  const webRef = useRef<WebView>(null);
  const listo = useRef(false);
  const [html] = useState(() => crearHtml(punto, false));

  useEffect(() => {
    if (listo.current) moverPin(webRef.current, latitud, longitud);
  }, [latitud, longitud]);

  return (
    <View style={styles.vista} pointerEvents="none" accessibilityLabel="Mapa con el punto del problema">
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://localhost" }}
        onLoadEnd={() => {
          listo.current = true;
          moverPin(webRef.current, latitud, longitud);
        }}
        onMessage={() => undefined}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

export function SelectorPunto({ inicial, onConfirmar, onCerrar }: Props) {
  const [punto, setPunto] = useState(inicial);
  const [sinMapa, setSinMapa] = useState(false);
  const [html] = useState(() => crearHtml(inicial, true));
  const margenes = useSafeAreaInsets();

  const alRecibirMensaje = (evento: WebViewMessageEvent) => {
    const mensaje = JSON.parse(evento.nativeEvent.data);
    if (mensaje.tipo === "sinMapa") setSinMapa(true);
    if (mensaje.tipo === "punto") setPunto({ latitud: mensaje.latitud, longitud: mensaje.longitud });
  };

  return (
    <Modal animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.contenedor}>
        <View style={styles.mapa}>
          <WebView
            originWhitelist={["*"]}
            source={{ html, baseUrl: "https://localhost" }}
            onMessage={alRecibirMensaje}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>

        <View style={[styles.ayuda, { top: margenes.top + 12 }]}>
          <Text style={styles.ayudaTexto}>
            {sinMapa
              ? "Sin conexión no podemos mostrar el mapa."
              : "Arrastrá el pin o tocá el mapa donde está el problema."}
          </Text>
        </View>

        <View style={[styles.acciones, { paddingBottom: margenes.bottom + 16 }]}>
          <Pressable style={styles.secundario} onPress={onCerrar} accessibilityRole="button">
            <Text style={styles.secundarioTexto}>{sinMapa ? "Volver" : "Cancelar"}</Text>
          </Pressable>
          {!sinMapa && (
            <Pressable
              style={styles.primario}
              onPress={() => onConfirmar(punto)}
              accessibilityRole="button"
            >
              <Text style={styles.primarioTexto}>Usar este punto</Text>
            </Pressable>
          )}
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
