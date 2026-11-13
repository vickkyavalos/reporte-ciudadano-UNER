import * as Location from "expo-location";
import { useEffect, useState } from "react";
import type { Coordenadas } from "@/tipos/reporte.interface";

export const CENTRO_CIUDAD: Coordenadas = { latitud: -33.0095, longitud: -58.5145 };

interface OpcionesUbicacion {
  precision?: Location.Accuracy;
  precisionInicial?: Location.Accuracy;
  edadMaximaMs?: number;
  esperaMs?: number;
}

export function useUbicacion({
  precision = Location.Accuracy.Balanced,
  precisionInicial,
  edadMaximaMs,
  esperaMs = 10000,
}: OpcionesUbicacion = {}) {
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [precisa, setPrecisa] = useState(false);
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    let llegoLaPrecisa = false;

    const guardar = ({ coords }: Location.LocationObject) => {
      setUbicacion({ latitud: coords.latitude, longitud: coords.longitude });
    };
    const pedirPosicion = (accuracy: Location.Accuracy) =>
      Promise.race([
        Location.getCurrentPositionAsync({ accuracy }),
        new Promise<never>((_, rechazar) =>
          setTimeout(() => rechazar(new Error("Timeout esperando el GPS")), esperaMs),
        ),
      ]);

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

        const ultima = await Location.getLastKnownPositionAsync({ maxAge: edadMaximaMs });
        console.log("[ubicacion] última conocida:", ultima?.coords);
        if (activo && ultima) guardar(ultima);

        if (precisionInicial !== undefined) {
          pedirPosicion(precisionInicial)
            .then((posicion) => {
              if (activo && !llegoLaPrecisa) guardar(posicion);
            })
            .catch(() => undefined);
        }

        const actual = await pedirPosicion(precision);
        console.log("[ubicacion] actual:", actual.coords);
        llegoLaPrecisa = true;
        if (activo) {
          guardar(actual);
          setPrecisa(true);
        }
      } catch (e) {
        console.log("[ubicacion] ERROR:", e);
        if (activo) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      activo = false;
    };
  }, [precision, precisionInicial, edadMaximaMs, esperaMs]);

  return { ubicacion: ubicacion ?? CENTRO_CIUDAD, encontrada: ubicacion !== null, precisa, permitido, error };
}
