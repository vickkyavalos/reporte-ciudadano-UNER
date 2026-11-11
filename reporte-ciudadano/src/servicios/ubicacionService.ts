import * as Location from "expo-location";
import type { Coordenadas } from "@/tipos/reporte.interface";

// Necesita conexión: sin señal devuelve null y se reintenta al subir el reporte.
export async function direccionDePunto(punto: Coordenadas): Promise<string | null> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({
      latitude: punto.latitud,
      longitude: punto.longitud,
    });
    const calle = lugar?.street ?? lugar?.name;
    if (!calle) return null;
    return [calle, lugar.streetNumber].filter(Boolean).join(" ");
  } catch {
    return null;
  }
}

export function textoPuntoSinDireccion(punto: Coordenadas): string {
  return `Punto en el mapa (${punto.latitud.toFixed(5)}, ${punto.longitud.toFixed(5)})`;
}
