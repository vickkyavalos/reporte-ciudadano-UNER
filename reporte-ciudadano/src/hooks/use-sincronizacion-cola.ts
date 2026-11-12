import * as Network from "expo-network";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { sincronizarCola } from "@/servicios/reportes";

const INTERVALO_MS = 60000;

// Una conexión puede figurar activa y no tener internet, y entonces no hay un
// cambio de red que avise cuando vuelve: por eso además se reintenta cada minuto.
export function useSincronizacionCola(activa: boolean) {
  useEffect(() => {
    if (!activa || Platform.OS === "web") return;

    const sincronizar = () => {
      sincronizarCola().catch((error) => console.warn("[cola] no se pudo sincronizar", error));
    };

    sincronizar();
    const red = Network.addNetworkStateListener(({ isConnected }) => {
      if (isConnected) sincronizar();
    });
    const app = AppState.addEventListener("change", (estado) => {
      if (estado === "active") sincronizar();
    });
    const intervalo = setInterval(sincronizar, INTERVALO_MS);

    return () => {
      red.remove();
      app.remove();
      clearInterval(intervalo);
    };
  }, [activa]);
}
