import * as Location from "expo-location";
import { useEffect, useState } from "react";
import type { Coordenadas } from "@/tipos/reporte.interface";

export const CENTRO_CIUDAD: Coordenadas = { latitud: -33.0095, longitud: -58.5145 };

export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [permitido, setPermitido] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!activo) return;
        if (status !== "granted") return setPermitido(false);
        setPermitido(true);
        const pos = await Location.getCurrentPositionAsync({});
        if (activo) setUbicacion({ latitud: pos.coords.latitude, longitud: pos.coords.longitude });
      } catch {
        if (activo) setPermitido(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return { ubicacion: ubicacion ?? CENTRO_CIUDAD, permitido };
}
