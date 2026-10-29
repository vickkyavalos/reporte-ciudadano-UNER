import * as Location from "expo-location";
import { useEffect, useState } from "react";
import type { Coordenadas } from "@/tipos/reporte.interface";

export const CENTRO_CIUDAD: Coordenadas = { latitud: -33.0095, longitud: -58.5145 };

export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const servicios = await Location.hasServicesEnabledAsync();
        console.log("[ubicacion] GPS del sistema activado:", servicios);

        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("[ubicacion] permiso:", status);
        if (!activo) return;
        if (status !== "granted") {
          setPermitido(false);
          setError("Permiso denegado");
          return;
        }
        setPermitido(true);

        const ultima = await Location.getLastKnownPositionAsync();
        console.log("[ubicacion] última conocida:", ultima?.coords);
        if (activo && ultima) {
          setUbicacion({ latitud: ultima.coords.latitude, longitud: ultima.coords.longitude });
        }
        const actual = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, rechazar) =>
            setTimeout(() => rechazar(new Error("Timeout esperando el GPS")), 10000),
          ),
        ]);
        console.log("[ubicacion] actual:", actual.coords);
        if (activo) {
          setUbicacion({ latitud: actual.coords.latitude, longitud: actual.coords.longitude });
        }
      } catch (e) {
        console.log("[ubicacion] ERROR:", e);
        if (activo) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return { ubicacion: ubicacion ?? CENTRO_CIUDAD, permitido, error };
}