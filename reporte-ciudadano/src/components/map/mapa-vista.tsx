import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { ESTADOS } from "@/constants/estados";
import type { Coordenadas, Reporte, TipoDeReporte } from "@/tipos/reporte.interface";
import { haceCuanto } from "@/utils/formato";

interface Props {
  centro: Coordenadas;
  reportes: Reporte[];
  tipos: TipoDeReporte[];
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}

const crearHtml = (centro: Coordenadas) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #e5e5e5; }
    .leaflet-popup-content { font-size: 15px; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map', { zoomControl: false }).setView([${centro.latitud}, ${centro.longitud}], 16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const capa = L.layerGroup().addTo(map);
  const marcadores = {};
  let yo = null;

  function enviar(obj) {
    window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }

  window.actualizar = function (d) {
    capa.clearLayers();
    Object.keys(marcadores).forEach(function (k) { delete marcadores[k]; });

    (d.reportes || []).forEach(function (r) {
      const sel = r.id === d.seleccionadoId;
      const m = L.circleMarker([r.latitud, r.longitud], {
        radius: sel ? 15 : 11,
        color: sel ? '#000' : '#fff',
        weight: sel ? 3 : 2,
        fillColor: r.color,
        fillOpacity: 1
      }).addTo(capa);
      m.bindPopup('<b>' + r.titulo + '</b><br>' + r.descripcion);
      m.on('click', function () { enviar({ tipo: 'marcador', id: r.id }); });
      marcadores[r.id] = m;
    });

    if (d.seleccionadoId && marcadores[d.seleccionadoId]) {
      const m = marcadores[d.seleccionadoId];
      map.setView(m.getLatLng(), 17, { animate: true });
      m.openPopup();
    }

    if (d.yo) {
      if (!yo) {
        yo = L.circleMarker([d.yo.latitud, d.yo.longitud], {
          radius: 8, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1
        }).addTo(map);
      } else {
        yo.setLatLng([d.yo.latitud, d.yo.longitud]);
      }
    }
  };
</script>
</body>
</html>`;

export function MapaReportes({ centro, reportes, tipos, seleccionadoId, onSeleccionar }: Props) {
  const webRef = useRef<WebView>(null);
  const listo = useRef(false);

  const html = useMemo(() => crearHtml(centro), []); 

  const enviarDatos = () => {
    if (!listo.current) return;
    const datos = {
      yo: centro,
      seleccionadoId,
      reportes: reportes.map((r) => ({
        id: r.id,
        latitud: r.coordenadas.latitud,
        longitud: r.coordenadas.longitud,
        color: ESTADOS[r.estado].pin,
        titulo: tipos.find((t) => t.id === r.tipoId)?.nombre ?? "Reporte",
        descripcion: haceCuanto(r.creadoEn),
      })),
    };
    webRef.current?.injectJavaScript(`window.actualizar(${JSON.stringify(datos)}); true;`);
  };

  useEffect(enviarDatos, [reportes, tipos, seleccionadoId, centro]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.tipo === "marcador") onSeleccionar(msg.id);
    } catch {
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://localhost" }}
        onMessage={onMessage}
        onLoadEnd={() => {
          listo.current = true;
          enviarDatos();
        }}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}