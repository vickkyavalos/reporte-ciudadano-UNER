import type { NetworkState } from "expo-network";

/**
 * Hay internet de verdad. `isConnected` sólo dice que hay Wi-Fi o datos: el Wi-Fi de un bar que
 * pide iniciar sesión da `isConnected: true` y no pasa nada (Unidad 5). Por eso se mira también
 * `isInternetReachable`, que puede venir sin dato (`undefined`/`null`) mientras el sistema lo
 * averigua: en ese caso se da el beneficio de la duda.
 */
export const hayInternet = (red: Partial<NetworkState>): boolean =>
  red.isConnected !== false && red.isInternetReachable !== false;
