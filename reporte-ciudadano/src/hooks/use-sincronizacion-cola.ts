import { hayInternet } from "@/servicios/red";
import * as Network from "expo-network";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { precargarCatalogos, sincronizarCola } from "@/servicios/reportes";

const INTERVALO_MS = 60000;

export function useSincronizacionCola(activa: boolean) {
  useEffect(() => {
    if (!activa || Platform.OS === "web") return;

    const sincronizar = () => {
      sincronizarCola().catch((error) => console.warn("[cola] no se pudo sincronizar", error));
    };

    const conSenal = () => {
      void precargarCatalogos();
      sincronizar();
    };

    conSenal();
    const red = Network.addNetworkStateListener((estado) => {
      if (hayInternet(estado)) conSenal();
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
