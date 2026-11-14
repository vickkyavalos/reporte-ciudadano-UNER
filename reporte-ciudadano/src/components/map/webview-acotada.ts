import type { WebViewProps } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

/**
 * Los mapas son un HTML propio (Leaflet) que se carga con baseUrl https://localhost. Como pide la
 * Unidad 6 (WebViews), se acota la WebView: sólo ese origen, ninguna navegación a otro dominio y
 * sin ventanas nuevas. Las teselas y el script de Leaflet se descargan como recursos, no como
 * navegación, así que siguen cargando.
 */
export const ORIGEN_MAPA = "https://localhost";

const permitida = (url: string) =>
  url === "about:blank" || url.startsWith(ORIGEN_MAPA);

export const propsWebViewAcotada: Pick<
  WebViewProps,
  "originWhitelist" | "onShouldStartLoadWithRequest" | "setSupportMultipleWindows" | "javaScriptEnabled"
> = {
  originWhitelist: [ORIGEN_MAPA],
  onShouldStartLoadWithRequest: (pedido: ShouldStartLoadRequest) => permitida(pedido.url),
  setSupportMultipleWindows: false,
  javaScriptEnabled: true,
};
