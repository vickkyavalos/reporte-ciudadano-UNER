import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ESTADOS } from "@/constants/estados";
import type { Coordenadas, Reporte } from "@/tipos/reporte.interface";
import type { TipoDeReporte } from "@/tipos/reporte.interface";
import { haceCuanto } from "@/utils/formato";
import { useEffect, useRef } from "react";

interface Props {
  centro: Coordenadas;
  reportes: Reporte[];
  tipos: TipoDeReporte[];
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}

export function MapaReportes({ centro, reportes, tipos, seleccionadoId, onSeleccionar }: Props) {
  const mapa = useRef<MapView>(null);

  useEffect(() => {
    const r = reportes.find((x) => x.id === seleccionadoId);
    if (r) {
      mapa.current?.animateToRegion(
        { latitude: r.coordenadas.latitud, longitude: r.coordenadas.longitud, latitudeDelta: 0.006, longitudeDelta: 0.006 },
        350
      );
    }
  }, [seleccionadoId, reportes]);

  return (
    <MapView
      ref={mapa}
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude: centro.latitud, longitude: centro.longitud, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {reportes.map((r) => {
        const tipo = tipos.find((t) => t.id === r.tipoId);
        return (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.coordenadas.latitud, longitude: r.coordenadas.longitud }}
            title={tipo?.nombre ?? "Reporte"}
            description={haceCuanto(r.creadoEn)}
            pinColor={ESTADOS[r.estado].pin}
            onPress={() => onSeleccionar(r.id)}
          />
        );
      })}
    </MapView>
  );
}
