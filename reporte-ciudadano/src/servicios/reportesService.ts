import { obtenerUsuario } from "@/servicios/authService";
import {
  registrarAvisoDeAdhesion,
  registrarAvisoDeEstado,
} from "@/servicios/avisosService";
import { DETALLES_OPERADOR_MOCK } from "@/mocks/detalleOperador.mock";
import { REPORTES_MOCK } from "@/mocks/reportes.mock";
import { TIPOS_MOCK } from "@/mocks/tipos-reportes.mock";
import type { RespuestaLista } from "@/tipos/api-interface";
import type {
  CambiosOperadorReporte,
  Coordenadas,
  PayloadCrearReporte,
  Reporte,
  TipoDeReporte,
} from "@/tipos/reporte.interface";
import { distanciaMetros } from "@/utils/formato";

export const MOCK_CONFIG = { simularErrorDeRed: false, demoraMs: 400 };

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
  const datos = reportes
    .filter((reporte) => reporte.autorId === autorId)
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .map(reporteVisibleParaVecino);
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: 20 } };
}

export async function obtenerReportePorId(reporteId: string): Promise<Reporte> {
  await simular();
  const reporte = reportes.find((actual) => actual.id === reporteId);
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

export async function crearReporte(payload: PayloadCrearReporte): Promise<Reporte> {
  await simular();
  const creadoEn = new Date().toISOString();
  const nuevoReporte: Reporte = {
    id: Math.random().toString(36).substring(7),
    codigo: `REP-${Math.floor(Math.random() * 10000)}`,
    tipoId: payload.tipoId,
    descripcion: payload.descripcion || null,
    audioUrl: payload.audioUrl || null,
    coordenadas: payload.coordenadas,
    direccion: payload.direccion,
    fotos: payload.fotosUris.map((uri, index) => ({
      id: `foto_${Date.now()}_${index}`,
      url: uri,
      momento: "problema",
    })),
    zonaId: "z_pendiente",
    estado: "recibido",
    autorId: obtenerUsuario()?.id ?? "usr_actual",
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn,
    sincronizado: false,
    historial: [{
      id: `cambio-${Date.now()}`,
      reporteId: "",
      estado: "recibido",
      comentario: null,
      operadorId: null,
      fechaHora: creadoEn,
    }],
    comentarioCierre: null,
  };
  nuevoReporte.historial[0].reporteId = nuevoReporte.id;
  reportes = [nuevoReporte, ...reportes];
  return reporteVisibleParaVecino(nuevoReporte);
}
