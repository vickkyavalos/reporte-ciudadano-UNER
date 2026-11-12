import * as Network from "expo-network";
import Storage from "expo-sqlite/kv-store";
import { asignarZona } from "@/hooks/geo";
import { obtenerUsuario } from "@/servicios/authService";
import { abrirArchivoLocal, borrarArchivoLocal } from "@/servicios/archivosLocales";
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
import type { RespuestaLista } from "@/tipos/api-interface";
import type { CambioDeEstado } from "@/tipos/cambioDeEstado";
import type {
  CambiosOperadorReporte,
  Coordenadas,
  Foto,
  PayloadCrearReporte,
  Reporte,
  TipoDeReporte,
} from "@/tipos/reporte.interface";
import type { Zona } from "@/tipos/zona.interface";
import { ahoraIsoArgentina, generarId } from "@/utils/formato";

const ESPERA_ENVIO_MS = 8000;
const TIMEOUT_LECTURA_MS = 15000;
const TIMEOUT_ARCHIVO_MS = 60000;
const TIMEOUT_REPORTE_MS = 30000;
const POR_PAGINA_LISTA = 100;
const POR_PAGINA_MAPA = 500;
const RADIO_MAPA_METROS = 50000;
const TODOS_LOS_ESTADOS = "recibido,en_revision,asignado,resuelto,rechazado";

// La API no manda estos dos campos: el historial sale de /reportes/:id/cambios.
type ReporteApi = Omit<Reporte, "historial" | "comentarioCierre">;

export class ErrorServicio extends Error {
  constructor(public codigo: string, mensaje: string) {
    super(mensaje);
  }
}

const esFaltaDeConexion = (error: unknown) =>
  error instanceof ErrorApi && (error.estado === 0 || error.estado >= 500);

const conParametros = (ruta: string, parametros: Record<string, string | number>) =>
  `${ruta}?${Object.entries(parametros)
    .map(([clave, valor]) => `${clave}=${encodeURIComponent(valor)}`)
    .join("&")}`;

async function pedirTodas<T>(
  ruta: string,
  parametros: Record<string, string | number>,
): Promise<T[]> {
  const todas: T[] = [];
  for (let pagina = 1; ; pagina += 1) {
    const { datos, meta } = await pedir<T[]>(conParametros(ruta, { ...parametros, pagina }), {
      timeoutMs: TIMEOUT_LECTURA_MS,
    });
    todas.push(...datos);
    if (datos.length === 0 || todas.length >= meta.total) return todas;
  }
}

// Sin señal se usa la última copia guardada: los catálogos hacen falta para
// armar un reporte offline.
async function conRespaldo<T>(clave: string, traer: () => Promise<T>): Promise<T> {
  try {
    const datos = await traer();
    await Storage.setItem(clave, JSON.stringify(datos));
    return datos;
  } catch (error) {
    if (esFaltaDeConexion(error)) {
      const guardado = await Storage.getItem(clave);
      if (guardado) return JSON.parse(guardado) as T;
    }
    throw error;
  }
}

const aReporte = (reporte: ReporteApi, historial: CambioDeEstado[] = []): Reporte => {
  const estaCerrado = reporte.estado === "resuelto" || reporte.estado === "rechazado";
  return {
    ...reporte,
    historial,
    comentarioCierre: estaCerrado
      ? historial.filter((cambio) => cambio.estado === reporte.estado).slice(-1)[0]?.comentario ?? null
      : null,
  };
};

const reporteVisibleParaVecino = (reporte: Reporte): Reporte => {
  const estaCerrado = reporte.estado === "resuelto" || reporte.estado === "rechazado";
  const ultimoCambioDeCierre = estaCerrado
    ? reporte.historial.filter((cambio) => cambio.estado === reporte.estado).slice(-1)
    : [];
  return {
    ...reporte,
    historial: ultimoCambioDeCierre.map((cambio) => ({ ...cambio, operadorId: null })),
  };
};

async function traerReporteCompleto(reporteId: string): Promise<Reporte> {
  const [{ datos: reporte }, historial] = await Promise.all([
    pedir<ReporteApi>(`/reportes/${reporteId}`, { timeoutMs: TIMEOUT_LECTURA_MS }),
    pedirTodas<CambioDeEstado>(`/reportes/${reporteId}/cambios`, { porPagina: POR_PAGINA_LISTA }),
  ]);
  return aReporte(reporte, historial);
}

export function obtenerTipos(): Promise<TipoDeReporte[]> {
  return conRespaldo("cache:tipos-de-reporte", () =>
    pedirTodas<TipoDeReporte>("/tipos-de-reporte", { porPagina: POR_PAGINA_LISTA }),
  );
}

export function obtenerZonas(): Promise<Zona[]> {
  return conRespaldo("cache:zonas", () =>
    pedirTodas<Zona>("/zonas", { porPagina: POR_PAGINA_LISTA }),
  );
}

export function obtenerReportesCercanos(centro: Coordenadas): Promise<RespuestaLista<Reporte>> {
  return conRespaldo("cache:reportes-cercanos", async () => {
    const { datos, meta } = await pedir<ReporteApi[]>(
      conParametros("/reportes", {
        latitud: centro.latitud,
        longitud: centro.longitud,
        radioMetros: RADIO_MAPA_METROS,
        porPagina: POR_PAGINA_MAPA,
      }),
      { timeoutMs: TIMEOUT_LECTURA_MS },
    );
    return { datos: datos.map((reporte) => aReporte(reporte)), meta };
  });
}

export async function sumarseAReporte(reporteId: string): Promise<Reporte> {
  const { datos } = await pedir<ReporteApi>(`/reportes/${reporteId}/adhesiones`, {
    metodo: "POST",
    timeoutMs: TIMEOUT_LECTURA_MS,
  });
  return aReporte(datos);
}

export async function obtenerMisReportes(autorId: string): Promise<RespuestaLista<Reporte>> {
  const enCola = (await listarCola(autorId)).map((entrada) => entrada.reporte);
  let publicados: Reporte[] = [];
  try {
    publicados = await conRespaldo(`cache:mis-reportes:${autorId}`, async () =>
      (await pedirTodas<ReporteApi>("/yo/reportes", { porPagina: POR_PAGINA_LISTA })).map((reporte) =>
        aReporte(reporte),
      ),
    );
  } catch (error) {
    // Sin señal y sin copia guardada, lo que está en la cola se tiene que seguir viendo.
    if (!esFaltaDeConexion(error) || enCola.length === 0) throw error;
  }
  const pendientes = enCola.filter(
    (pendiente) => !publicados.some((reporte) => reporte.id === pendiente.id),
  );
  const datos = [...pendientes, ...publicados]
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .map(reporteVisibleParaVecino);
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: datos.length } };
}

export async function obtenerReportePorId(reporteId: string): Promise<Reporte> {
  const pendiente = (await obtenerDeCola(reporteId))?.reporte;
  if (pendiente) return reporteVisibleParaVecino(pendiente);
  return reporteVisibleParaVecino(
    await conRespaldo(`cache:reporte:${reporteId}`, () => traerReporteCompleto(reporteId)),
  );
}

// Se usa /reportes y no /bandeja porque la bandeja sólo trae los reportes
// abiertos y la pantalla del operador también filtra resueltos y rechazados.
export async function obtenerReportesOperador(): Promise<Reporte[]> {
  const reportes = await pedirTodas<ReporteApi>("/reportes", {
    estado: TODOS_LOS_ESTADOS,
    porPagina: POR_PAGINA_MAPA,
  });
  return reportes.map((reporte) => aReporte(reporte));
}

export function obtenerReporteOperadorPorId(reporteId: string): Promise<Reporte> {
  return traerReporteCompleto(reporteId);
}

// La pantalla guarda todo junto y la API tiene un endpoint por cada acción. El
// archivo se sube primero para que un fallo de subida no deje el reclamo a medias.
export async function actualizarReporteOperador(
  reporteId: string,
  cambios: CambiosOperadorReporte,
): Promise<Reporte> {
  const comentario = cambios.comentario.trim();
  if (!comentario) {
    throw new ErrorServicio("MOTIVO_REQUERIDO", "Escribí el motivo de los cambios.");
  }
  if (cambios.estado === "resuelto" && !cambios.fotoArreglo) {
    throw new ErrorServicio(
      "FOTO_ARREGLO_REQUERIDA",
      "Adjuntá una foto del arreglo antes de cerrar el reclamo como resuelto.",
    );
  }
  if (cambios.duplicadoDe === reporteId) {
    throw new ErrorServicio("DUPLICADO_INVALIDO", "Un reclamo no puede duplicarse a sí mismo.");
  }

  const actual = await traerReporteCompleto(reporteId);
  if (actual.duplicadoDe && cambios.duplicadoDe !== actual.duplicadoDe) {
    throw new ErrorServicio("DUPLICADO_INVALIDO", "Un reclamo marcado como duplicado no se puede cambiar.");
  }
  if (actual.cuadrillaId && !cambios.cuadrillaId) {
    throw new ErrorServicio("CUADRILLA_REQUERIDA", "La cuadrilla se puede cambiar por otra, pero no quitar.");
  }

  if (cambios.duplicadoDe && cambios.duplicadoDe !== actual.duplicadoDe) {
    await pedir(`/reportes/${reporteId}/duplicado`, {
      metodo: "POST",
      cuerpo: { originalId: cambios.duplicadoDe },
      timeoutMs: TIMEOUT_LECTURA_MS,
    });
    return traerReporteCompleto(reporteId);
  }

  const fotoNueva =
    cambios.fotoArreglo &&
    !actual.fotos.some((foto) => foto.momento === "arreglo" && foto.url === cambios.fotoArreglo)
      ? await subirArchivo(cambios.fotoArreglo)
      : null;

  let estado = actual.estado;
  const pasaAAsignado = cambios.estado === "asignado" && estado !== "asignado";
  if (cambios.cuadrillaId && (cambios.cuadrillaId !== actual.cuadrillaId || pasaAAsignado)) {
    await pedir(`/reportes/${reporteId}/cuadrilla`, {
      metodo: "PATCH",
      cuerpo: { cuadrillaId: cambios.cuadrillaId, comentario },
      timeoutMs: TIMEOUT_LECTURA_MS,
    });
    estado = "asignado";
  }
  if (cambios.estado !== estado) {
    await pedir(`/reportes/${reporteId}/estado`, {
      metodo: "PATCH",
      cuerpo: { estado: cambios.estado, comentario },
      timeoutMs: TIMEOUT_LECTURA_MS,
    });
  }
  if (fotoNueva) {
    await pedir(`/reportes/${reporteId}/fotos`, {
      metodo: "POST",
      cuerpo: { url: fotoNueva },
      timeoutMs: TIMEOUT_LECTURA_MS,
    });
  }
  return traerReporteCompleto(reporteId);
}

async function subirArchivo(uriLocal: string): Promise<string> {
  const formData = new FormData();
  formData.append("archivo", abrirArchivoLocal(uriLocal));
  const { datos } = await pedir<{ url: string }>("/archivos", {
    metodo: "POST",
    formData,
    timeoutMs: TIMEOUT_ARCHIVO_MS,
  });
  return datos.url;
}

async function publicarReporte(reporte: Reporte): Promise<void> {
  await pedir<ReporteApi>("/reportes", {
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

  await publicarReporte({ ...reporte, fotos, audioUrl, direccion });
  await quitarDeCola(reporte.id);

  for (const [uriLocal, url] of Object.entries(archivosSubidos)) {
    if (uriLocal !== url) borrarArchivoLocal(uriLocal);
  }
}

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

  if (await obtenerDeCola(id)) return reporte;
  return traerReporteCompleto(id).catch(() => reporte);
}
