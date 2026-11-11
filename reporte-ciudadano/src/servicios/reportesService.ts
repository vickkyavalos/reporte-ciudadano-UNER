import * as Network from "expo-network";
import { asignarZona } from "@/hooks/geo";
import { obtenerUsuario } from "@/servicios/authService";
import { abrirArchivoLocal, borrarArchivoLocal } from "@/servicios/archivosLocales";
import {
  registrarAvisoDeAdhesion,
  registrarAvisoDeEstado,
} from "@/servicios/avisosService";
import { ErrorApi, pedir } from "@/servicios/clienteService";
import {
  actualizarEntrada,
  encolar,
  listarCola,
  obtenerDeCola,
  quitarDeCola,
  type EntradaCola,
} from "@/servicios/colaReportes";
import { direccionDePunto } from "@/servicios/ubicacionService";
import { DETALLES_OPERADOR_MOCK } from "@/mocks/detalleOperador.mock";
import { REPORTES_MOCK } from "@/mocks/reportes.mock";
import { TIPOS_MOCK } from "@/mocks/tipos-reportes.mock";
import { mock_zonas } from "@/mocks/zona.mock";
import type { RespuestaLista } from "@/tipos/api-interface";
import type {
  CambiosOperadorReporte,
  Coordenadas,
  Foto,
  PayloadCrearReporte,
  Reporte,
  TipoDeReporte,
} from "@/tipos/reporte.interface";
import type { Zona } from "@/tipos/zona.interface";
import { ahoraIsoArgentina, distanciaMetros, generarId } from "@/utils/formato";

export const MOCK_CONFIG = { simularErrorDeRed: false, demoraMs: 400 };

const USAR_API = Boolean(process.env.EXPO_PUBLIC_API_URL);
const ESPERA_ENVIO_MS = 8000;
const TIMEOUT_ARCHIVO_MS = 60000;
const TIMEOUT_REPORTE_MS = 30000;
let correlativoMock = 500;

export class ErrorServicio extends Error {
  constructor(public codigo: string, mensaje: string) {
    super(mensaje);
  }
}

const esperar = () => new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.demoraMs));

async function simular() {
  await esperar();
  if (MOCK_CONFIG.simularErrorDeRed) {
    throw new ErrorServicio("SIN_CONEXION", "No pudimos conectarnos. Revisá tu señal e intentá de nuevo.");
  }
}

const tipoIdPorNombre: Record<string, string> = {
  Bache: "tip-bache",
  Luz: "tip-luminaria",
  Residuos: "tip-basura",
  Pluviales: "tip-otro",
  Vereda: "tip-vereda",
  Agua: "tip-agua",
};

const zonaIdPorNombre: Record<string, string> = {
  Centro: "zon-centro",
  Norte: "zon-norte",
  Sur: "zon-sur",
  Oeste: "zon-oeste",
};

const reportesOperadorMock: Reporte[] = DETALLES_OPERADOR_MOCK.map((detalle, indice) => ({
  id: detalle.id,
  codigo: detalle.codigo,
  tipoId: tipoIdPorNombre[detalle.tipo] ?? "tip-otro",
  descripcion: detalle.descripcion || null,
  audioUrl: null,
  coordenadas: {
    latitud: -33.008 + indice * 0.0002,
    longitud: -58.514 + indice * 0.0002,
  },
  fotos: [
    ...(detalle.fotoProblema
      ? [{ id: `${detalle.id}-foto-problema`, url: detalle.fotoProblema, momento: "problema" as const }]
      : []),
    ...(detalle.fotoArreglo
      ? [{ id: `${detalle.id}-foto-arreglo`, url: detalle.fotoArreglo, momento: "arreglo" as const }]
      : []),
  ],
  direccion: detalle.direccion,
  zonaId: zonaIdPorNombre[detalle.zona] ?? "zon-centro",
  estado: detalle.estado,
  autorId: indice === 0 ? "usr-084" : `usr-${String(30 + indice).padStart(3, "0")}`,
  cuadrillaId: detalle.cuadrillaId,
  duplicadoDe: detalle.duplicadoDe,
  adhesiones: detalle.adhesiones,
  creadoEn: detalle.creadoEn,
  sincronizado: true,
  historial: detalle.historial.map((cambio) => ({ ...cambio })),
  comentarioCierre:
    detalle.estado === "resuelto" || detalle.estado === "rechazado"
      ? detalle.historial[detalle.historial.length - 1]?.comentario ?? null
      : null,
}));

const idsOperadorMock = new Set(reportesOperadorMock.map((reporte) => reporte.id));
let reportes: Reporte[] = [
  ...REPORTES_MOCK
    .filter((reporte) => !idsOperadorMock.has(reporte.id))
    .map((reporte) => ({ ...reporte, fotos: [...reporte.fotos], historial: [...reporte.historial] })),
  ...reportesOperadorMock,
];

const copiaReporte = (reporte: Reporte): Reporte => ({
  ...reporte,
  fotos: reporte.fotos.map((foto) => ({ ...foto })),
  historial: reporte.historial.map((cambio) => ({ ...cambio })),
});

const reporteVisibleParaVecino = (reporte: Reporte): Reporte => {
  const estaCerrado = reporte.estado === "resuelto" || reporte.estado === "rechazado";
  const ultimoCambioDeCierre = estaCerrado
    ? reporte.historial.filter((cambio) => cambio.estado === reporte.estado).slice(-1)
    : [];
  return {
    ...copiaReporte(reporte),
    historial: ultimoCambioDeCierre.map((cambio) => ({ ...cambio, operadorId: null })),
  };
};

export async function obtenerTipos(): Promise<TipoDeReporte[]> {
  await simular();
  return TIPOS_MOCK.map((tipo) => ({ ...tipo }));
}

export async function obtenerReportesCercanos(
  centro: Coordenadas
): Promise<RespuestaLista<Reporte>> {
  await simular();
  const datos = [...reportes]
    .sort((a, b) => distanciaMetros(centro, a.coordenadas) - distanciaMetros(centro, b.coordenadas))
    .map(reporteVisibleParaVecino);
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: 20 } };
}

export async function sumarseAReporte(reporteId: string): Promise<Reporte> {
  await simular();
  const actual = reportes.find((reporte) => reporte.id === reporteId);
  if (!actual) throw new ErrorServicio("REPORTE_NO_ENCONTRADO", "Ese reporte ya no existe.");
  actual.adhesiones += 1;
  const participanteId = obtenerUsuario()?.id;
  if (participanteId && participanteId !== actual.autorId) {
    await registrarAvisoDeAdhesion(actual.autorId, actual.id);
  }
  return reporteVisibleParaVecino(actual);
}

export async function obtenerMisReportes(
  autorId: string
): Promise<RespuestaLista<Reporte>> {
  await simular();
  const pendientes = (await listarCola(autorId))
    .map((entrada) => entrada.reporte)
    .filter((pendiente) => !reportes.some((reporte) => reporte.id === pendiente.id));
  const datos = [...pendientes, ...reportes.filter((reporte) => reporte.autorId === autorId)]
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .map(reporteVisibleParaVecino);
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: 20 } };
}

export async function obtenerReportePorId(reporteId: string): Promise<Reporte> {
  await simular();
  const reporte =
    reportes.find((actual) => actual.id === reporteId) ?? (await obtenerDeCola(reporteId))?.reporte;
  if (!reporte) {
    throw new ErrorServicio("REPORTE_NO_ENCONTRADO", "No encontramos ese reporte.");
  }
  return reporteVisibleParaVecino(reporte);
}

export async function obtenerReportesOperador(): Promise<Reporte[]> {
  await simular();
  return reportes.map(copiaReporte);
}

export async function obtenerReporteOperadorPorId(reporteId: string): Promise<Reporte> {
  await simular();
  const reporte = reportes.find((actual) => actual.id === reporteId);
  if (!reporte) {
    throw new ErrorServicio("REPORTE_NO_ENCONTRADO", "No encontramos ese reclamo.");
  }
  return copiaReporte(reporte);
}

export async function actualizarReporteOperador(
  reporteId: string,
  cambios: CambiosOperadorReporte
): Promise<Reporte> {
  await simular();
  const actual = reportes.find((reporte) => reporte.id === reporteId);
  if (!actual) {
    throw new ErrorServicio("REPORTE_NO_ENCONTRADO", "No encontramos ese reclamo.");
  }
  if (!cambios.comentario.trim()) {
    throw new ErrorServicio("MOTIVO_REQUERIDO", "Escribí el motivo de los cambios.");
  }
  if (cambios.estado === "resuelto" && !cambios.fotoArreglo) {
    throw new ErrorServicio(
      "FOTO_ARREGLO_REQUERIDA",
      "Adjuntá una foto del arreglo antes de cerrar el reclamo como resuelto."
    );
  }
  if (cambios.duplicadoDe === reporteId) {
    throw new ErrorServicio("DUPLICADO_INVALIDO", "Un reclamo no puede duplicarse a sí mismo.");
  }

  const cambioDuplicado = cambios.duplicadoDe !== actual.duplicadoDe;
  const objetivo = cambios.duplicadoDe
    ? reportes.find((reporte) => reporte.id === cambios.duplicadoDe)
    : undefined;
  if (cambios.duplicadoDe && !objetivo) {
    throw new ErrorServicio("REPORTE_NO_ENCONTRADO", "No se encontró el reclamo original.");
  }

  if (cambioDuplicado && actual.duplicadoDe) {
    const duplicadoAnterior = reportes.find((reporte) => reporte.id === actual.duplicadoDe);
    if (duplicadoAnterior) {
      duplicadoAnterior.adhesiones = Math.max(0, duplicadoAnterior.adhesiones - 1);
    }
  }
  if (cambioDuplicado && objetivo) {
    objetivo.adhesiones += 1;
  }

  const estadoCambio = cambios.estado !== actual.estado;
  const historial = estadoCambio || cambioDuplicado
    ? [
        ...actual.historial,
        {
          id: `cambio-${Date.now()}`,
          reporteId: actual.id,
          estado: cambios.estado,
          comentario: cambios.comentario.trim(),
          operadorId: obtenerUsuario()?.id ?? "operador-demo",
          fechaHora: new Date().toISOString(),
        },
      ]
    : actual.historial;
  const fotos = actual.fotos.filter((foto) => foto.momento !== "arreglo");
  if (cambios.fotoArreglo) {
    fotos.push({
      id: `${actual.id}-arreglo-${Date.now()}`,
      url: cambios.fotoArreglo,
      momento: "arreglo",
    });
  }

  const actualizado: Reporte = {
    ...actual,
    estado: cambios.estado,
    cuadrillaId: cambios.cuadrillaId,
    duplicadoDe: cambios.duplicadoDe,
    fotos,
    historial,
    comentarioCierre:
      cambios.estado === "resuelto" || cambios.estado === "rechazado"
        ? cambios.comentario.trim()
        : null,
  };
  reportes = reportes.map((reporte) => (reporte.id === reporteId ? actualizado : reporte));
  if (estadoCambio) {
    await registrarAvisoDeEstado(actualizado.autorId, actualizado.id, actualizado.estado);
  }
  if (cambioDuplicado && objetivo) {
    await registrarAvisoDeAdhesion(objetivo.autorId, objetivo.id);
  }
  return copiaReporte(actualizado);
}

export async function obtenerZonas(): Promise<Zona[]> {
  return mock_zonas.map((zona) => ({ ...zona, limite: [...zona.limite] }));
}

async function subirArchivo(uriLocal: string): Promise<string> {
  if (!USAR_API) {
    await simular();
    return uriLocal;
  }
  const formData = new FormData();
  formData.append("archivo", abrirArchivoLocal(uriLocal));
  const { datos } = await pedir<{ url: string }>("/archivos", {
    metodo: "POST",
    formData,
    timeoutMs: TIMEOUT_ARCHIVO_MS,
  });
  return datos.url;
}

async function publicarReporte(reporte: Reporte): Promise<Reporte> {
  if (USAR_API) {
    const { datos } = await pedir<Omit<Reporte, "historial" | "comentarioCierre">>("/reportes", {
      metodo: "POST",
      cuerpo: {
        id: reporte.id,
        tipoId: reporte.tipoId,
        descripcion: reporte.descripcion,
        audioUrl: reporte.audioUrl,
        fotos: reporte.fotos.map(({ id, url }) => ({ id, url })),
        coordenadas: reporte.coordenadas,
        direccion: reporte.direccion,
        creadoEn: reporte.creadoEn,
      },
      timeoutMs: TIMEOUT_REPORTE_MS,
    });
    return { ...datos, historial: reporte.historial, comentarioCierre: null };
  }

  await simular();
  const yaPublicado = reportes.find((actual) => actual.id === reporte.id);
  if (yaPublicado) return yaPublicado;
  correlativoMock += 1;
  return {
    ...reporte,
    codigo: `GCHU-${reporte.creadoEn.slice(0, 4)}-${String(correlativoMock).padStart(5, "0")}`,
    sincronizado: true,
  };
}

async function subirEntrada(entrada: EntradaCola): Promise<void> {
  const { reporte } = entrada;
  const archivosSubidos = { ...entrada.archivosSubidos };

  const urlDe = async (uriLocal: string): Promise<string> => {
    if (!archivosSubidos[uriLocal]) {
      archivosSubidos[uriLocal] = await subirArchivo(uriLocal);
      await actualizarEntrada({ ...entrada, archivosSubidos });
    }
    return archivosSubidos[uriLocal];
  };

  const fotos: Foto[] = [];
  for (const foto of reporte.fotos) {
    fotos.push({ ...foto, url: await urlDe(foto.url) });
  }
  const audioUrl = reporte.audioUrl ? await urlDe(reporte.audioUrl) : null;
  const direccion = entrada.direccionPendiente
    ? (await direccionDePunto(reporte.coordenadas)) ?? reporte.direccion
    : reporte.direccion;

  const publicado = await publicarReporte({ ...reporte, fotos, audioUrl, direccion });
  reportes = [publicado, ...reportes.filter((actual) => actual.id !== publicado.id)];
  await quitarDeCola(reporte.id);

  for (const [uriLocal, url] of Object.entries(archivosSubidos)) {
    if (uriLocal !== url) borrarArchivoLocal(uriLocal);
  }
}

const esFaltaDeConexion = (error: unknown) =>
  error instanceof ErrorServicio
    ? error.codigo === "SIN_CONEXION"
    : error instanceof ErrorApi && (error.estado === 0 || error.estado >= 500);

async function procesarCola(): Promise<void> {
  const usuario = obtenerUsuario();
  if (!usuario) return;
  const red = await Network.getNetworkStateAsync();
  if (red.isConnected === false) return;

  for (const entrada of await listarCola(usuario.id)) {
    try {
      await subirEntrada(entrada);
    } catch (error) {
      const actual = await obtenerDeCola(entrada.reporte.id);
      if (actual) {
        const ultimoError = error instanceof Error ? error.message : "No se pudo subir el reporte.";
        await actualizarEntrada({ ...actual, ultimoError });
      }
      if (esFaltaDeConexion(error)) return;
    }
  }
}

let sincronizando: Promise<void> | null = null;
let otraVuelta = false;

// Una sola sincronización a la vez: dos en paralelo subirían dos veces los mismos archivos.
export function sincronizarCola(): Promise<void> {
  if (sincronizando) {
    otraVuelta = true;
    return sincronizando;
  }
  sincronizando = (async () => {
    try {
      do {
        otraVuelta = false;
        await procesarCola();
      } while (otraVuelta);
    } finally {
      sincronizando = null;
    }
  })();
  return sincronizando;
}

// Primero se guarda en el teléfono y recién después se intenta subir: así el
// reporte no se pierde aunque la señal se corte en medio del envío.
export async function crearReporte(payload: PayloadCrearReporte): Promise<Reporte> {
  const usuario = obtenerUsuario();
  if (!usuario) throw new ErrorServicio("NO_AUTENTICADO", "Iniciá sesión para enviar el reporte.");
  if (payload.fotosUris.length === 0) {
    throw new ErrorServicio("FOTO_REQUERIDA", "El reporte necesita al menos una foto.");
  }
  const zonaId = asignarZona(payload.coordenadas, await obtenerZonas(), 0);
  if (!zonaId) {
    throw new ErrorServicio("FUERA_DE_LA_CIUDAD", "Ese punto queda fuera de Gualeguaychú. Corregilo en el mapa.");
  }

  const id = generarId("rep");
  const creadoEn = ahoraIsoArgentina();
  const reporte: Reporte = {
    id,
    codigo: `LOCAL-${id.slice(-6).toUpperCase()}`,
    tipoId: payload.tipoId,
    descripcion: payload.descripcion,
    audioUrl: payload.audioUrl,
    coordenadas: payload.coordenadas,
    direccion: payload.direccion,
    fotos: payload.fotosUris.map((url) => ({ id: generarId("fot"), url, momento: "problema" })),
    zonaId,
    estado: "recibido",
    autorId: usuario.id,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn,
    sincronizado: false,
    historial: [{
      id: generarId("cam"),
      reporteId: id,
      estado: "recibido",
      comentario: null,
      operadorId: null,
      fechaHora: creadoEn,
    }],
    comentarioCierre: null,
  };

  await encolar({
    reporte,
    direccionPendiente: payload.direccionPendiente,
    archivosSubidos: {},
    ultimoError: null,
  });

  // Si la señal es mala no se hace esperar al vecino: la subida sigue sola.
  await Promise.race([
    sincronizarCola().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, ESPERA_ENVIO_MS)),
  ]);

  const publicado = reportes.find((actual) => actual.id === id);
  return copiaReporte(publicado ?? reporte);
}
