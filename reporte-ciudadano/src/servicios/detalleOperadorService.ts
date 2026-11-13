import { api } from "@/servicios/api";
import {
  abrirArchivoLocal,
  LIMITE_FOTO_BYTES,
} from "@/servicios/archivosLocales";
import type { CambioDeEstado } from "@/tipos/cambioDeEstado";
import type { Cuadrilla } from "@/tipos/cuadrilla.interface";
import type {
  CambiosDetalleOperador,
  CatalogosDetalleOperador,
  DetalleReclamoOperador,
} from "@/tipos/detalleOperador.interface";
import type { ReclamoOperador } from "@/tipos/operador.interface";
import type {
  EstadoReporte,
  Reporte,
  TipoDeReporte,
} from "@/tipos/reporte.interface";
import type { Zona } from "@/tipos/zona.interface";

type ReporteApi = Omit<Reporte, "historial" | "comentarioCierre">;
type RespuestaLista<T> = {
  datos: T[];
  meta: { total: number; pagina: number; porPagina: number };
};
type RespuestaUno<T> = { datos: T; meta: null };
type ArchivoSubido = { url: string };

const POR_PAGINA = 100;
const TIMEOUT_SUBIDA_ARCHIVO_MS = 60_000;
const ESTADOS_REPORTE = "recibido,en_revision,asignado,resuelto,rechazado";
const ESTADOS_ABIERTOS = new Set<EstadoReporte>([
  "recibido",
  "en_revision",
  "asignado",
]);

async function obtenerTodas<T>(
  ruta: string,
  parametros: Record<string, string | number | boolean> = {},
): Promise<T[]> {
  const resultados: T[] = [];

  for (let pagina = 1; ; pagina += 1) {
    const { data } = await api.get<RespuestaLista<T>>(ruta, {
      params: { ...parametros, pagina, porPagina: POR_PAGINA },
    });
    resultados.push(...data.datos);
    if (resultados.length >= data.meta.total || data.datos.length === 0) {
      return resultados;
    }
  }
}

function obtenerReportesApi(): Promise<ReporteApi[]> {
  return obtenerTodas<ReporteApi>("/reportes", { estado: ESTADOS_REPORTE });
}

function obtenerTipos(): Promise<TipoDeReporte[]> {
  return obtenerTodas<TipoDeReporte>("/tipos-de-reporte");
}

function obtenerZonas(): Promise<Zona[]> {
  return obtenerTodas<Zona>("/zonas");
}

async function obtenerReporteApi(ruta: string): Promise<ReporteApi> {
  const { data } = await api.get<RespuestaUno<ReporteApi>>(ruta);
  return data.datos;
}

async function obtenerHistorial(reporteId: string): Promise<CambioDeEstado[]> {
  return obtenerTodas<CambioDeEstado>(
    `/reportes/${encodeURIComponent(reporteId)}/cambios`,
  );
}

function desdeReporte(
  reporte: ReporteApi,
  tipos: TipoDeReporte[],
  zonas: Zona[],
  historial: CambioDeEstado[] = [],
): DetalleReclamoOperador {
  const tipo = tipos.find((actual) => actual.id === reporte.tipoId);
  if (!tipo) {
    throw new Error(`No encontramos el tipo de reporte ${reporte.tipoId}.`);
  }

  const zona = zonas.find((actual) => actual.id === reporte.zonaId);
  if (!zona) {
    throw new Error(`No encontramos la zona ${reporte.zonaId}.`);
  }
  const fotosArreglo = reporte.fotos
    .filter((foto) => foto.momento === "arreglo")
    .map((foto) => foto.url);

  return {
    id: reporte.id,
    codigo: reporte.codigo,
    tipo: tipo.nombre,
    direccion: reporte.direccion,
    zona: zona.nombre,
    zonaId: reporte.zonaId,
    estado: reporte.estado,
    creadoEn: reporte.creadoEn,
    adhesiones: reporte.adhesiones,
    descripcion: reporte.descripcion ?? "",
    cuadrillaId: reporte.cuadrillaId,
    fotoProblema:
      reporte.fotos.find((foto) => foto.momento === "problema")?.url ?? null,
    fotoArreglo: fotosArreglo[0] ?? null,
    fotosArreglo,
    duplicadoDe: reporte.duplicadoDe,
    historial,
  };
}

function desdeReporteParaBandeja(
  reporte: ReporteApi,
  tipos: TipoDeReporte[],
  zonas: Zona[],
): ReclamoOperador {
  const detalle = desdeReporte(reporte, tipos, zonas);
  return {
    id: detalle.id,
    codigo: detalle.codigo,
    tipo: detalle.tipo,
    direccion: detalle.direccion,
    zona: detalle.zona,
    estado: detalle.estado,
    creadoEn: detalle.creadoEn,
    adhesiones: detalle.adhesiones,
    descripcion: detalle.descripcion,
  };
}

async function obtenerDetalleCompleto(
  reporte: ReporteApi,
): Promise<DetalleReclamoOperador> {
  const [historial, tipos, zonas] = await Promise.all([
    obtenerHistorial(reporte.id),
    obtenerTipos(),
    obtenerZonas(),
  ]);
  return desdeReporte(reporte, tipos, zonas, historial);
}

export async function obtenerDetallesOperador(): Promise<DetalleReclamoOperador[]> {
  const [reportes, tipos, zonas] = await Promise.all([
    obtenerReportesApi(),
    obtenerTipos(),
    obtenerZonas(),
  ]);
  return reportes.map((reporte) => desdeReporte(reporte, tipos, zonas));
}

export async function obtenerDetalleOperador(
  reclamoId: string,
): Promise<DetalleReclamoOperador> {
  const reporte = await obtenerReporteApi(
    `/reportes/${encodeURIComponent(reclamoId)}`,
  );
  return obtenerDetalleCompleto(reporte);
}

export async function obtenerCatalogosDetalleOperador(
  zonaId: string,
  reclamoId: string,
): Promise<CatalogosDetalleOperador> {
  const [cuadrillas, reportes, tipos, zonas] = await Promise.all([
    obtenerTodas<Cuadrilla>("/cuadrillas", { zonaId, activa: true }),
    obtenerReportesApi(),
    obtenerTipos(),
    obtenerZonas(),
  ]);
  const reportesElegibles = reportes.filter(
    (reporte) =>
      reporte.id !== reclamoId &&
      reporte.duplicadoDe === null &&
      ESTADOS_ABIERTOS.has(reporte.estado),
  );

  return {
    cuadrillas,
    reportes: reportesElegibles.map((reporte) =>
      desdeReporteParaBandeja(reporte, tipos, zonas),
    ),
  };
}

export async function buscarDetalleOperadorPorQr(
  valorQr: string,
): Promise<DetalleReclamoOperador> {
  const codigo = valorQr.trim().split(/[/?#=]/).filter(Boolean).pop();
  if (!codigo) {
    throw new Error("El QR no contiene un código de reclamo.");
  }

  const reporte = await obtenerReporteApi(
    `/reportes/codigo/${encodeURIComponent(codigo)}`,
  );
  return obtenerDetalleCompleto(reporte);
}

async function subirFotoArreglo(uri: string): Promise<string> {
  const archivo = abrirArchivoLocal(uri);
  if (archivo.size > LIMITE_FOTO_BYTES) {
    throw new Error("Cada foto del arreglo puede pesar hasta 5 MB. Elegí una más liviana.");
  }
  const formData = new FormData();
  formData.append("archivo", archivo);
  const { data } = await api.post<RespuestaUno<ArchivoSubido>>(
    "/archivos",
    formData,
    { timeout: TIMEOUT_SUBIDA_ARCHIVO_MS, adapter: "fetch" },
  );
  return data.datos.url;
}

export async function guardarCambiosDetalleOperador(
  reclamoId: string,
  cambios: CambiosDetalleOperador,
): Promise<DetalleReclamoOperador> {
  const comentario = cambios.comentario.trim();
  if (!comentario) {
    throw new Error("Escribí el motivo de los cambios.");
  }
  if (cambios.estado === "resuelto" && cambios.fotosArreglo.length === 0) {
    throw new Error("Adjuntá una foto del arreglo antes de cerrar el reclamo como resuelto.");
  }
  if (cambios.duplicadoDe === reclamoId) {
    throw new Error("Un reclamo no puede duplicarse a sí mismo.");
  }

  const rutaReporte = `/reportes/${encodeURIComponent(reclamoId)}`;
  const actual = await obtenerReporteApi(rutaReporte);
  if (actual.duplicadoDe && cambios.duplicadoDe !== actual.duplicadoDe) {
    throw new Error("Un reclamo marcado como duplicado no se puede cambiar.");
  }
  if (actual.cuadrillaId && !cambios.cuadrillaId) {
    throw new Error("La cuadrilla se puede cambiar por otra, pero no quitar.");
  }

  if (cambios.duplicadoDe && cambios.duplicadoDe !== actual.duplicadoDe) {
    await api.post(
      `${rutaReporte}/duplicado`,
      { originalId: cambios.duplicadoDe },
    );
    return obtenerDetalleOperador(reclamoId);
  }

  const fotosArregloActual = actual.fotos.filter(
    (foto) => foto.momento === "arreglo",
  );
  const fotosNuevasLocales = cambios.fotosArreglo.filter(
    (uri) => !fotosArregloActual.some((foto) => foto.url === uri),
  );
  if (fotosArregloActual.length + fotosNuevasLocales.length > 3) {
    throw new Error("Se pueden subir hasta tres fotos del arreglo.");
  }
  let estado = actual.estado;
  const pasaAAsignado = cambios.estado === "asignado" && estado !== "asignado";
  const cambiaCuadrilla =
    cambios.cuadrillaId &&
    (cambios.cuadrillaId !== actual.cuadrillaId || pasaAAsignado);
  const estadoFinalPrevisto =
    cambiaCuadrilla && cambios.estado === actual.estado
      ? "asignado"
      : cambios.estado === "asignado" && !cambiaCuadrilla
        ? actual.estado
        : cambios.estado;
  if (
    fotosNuevasLocales.length > 0 &&
    estadoFinalPrevisto !== "asignado" &&
    estadoFinalPrevisto !== "resuelto"
  ) {
    throw new Error("Las fotos del arreglo solo se pueden subir con el reclamo asignado o resuelto.");
  }
  const fotosSubidas: string[] = [];
  for (const uri of fotosNuevasLocales) {
    fotosSubidas.push(await subirFotoArreglo(uri));
  }

  if (cambiaCuadrilla && estado === "recibido") {
    await api.patch(`${rutaReporte}/estado`, {
      estado: "en_revision",
      comentario,
    });
    estado = "en_revision";
  }
  if (cambiaCuadrilla) {
    await api.patch(`${rutaReporte}/cuadrilla`, {
      cuadrillaId: cambios.cuadrillaId,
      comentario,
    });
    estado = "asignado";
  }
  if (cambios.estado !== estado && cambios.estado !== actual.estado) {
    await api.patch(`${rutaReporte}/estado`, {
      estado: cambios.estado,
      comentario,
    });
  }
  for (const url of fotosSubidas) {
    await api.post(`${rutaReporte}/fotos`, { url });
  }

  return obtenerDetalleOperador(reclamoId);
}
