import { mock_cuadrilla } from "@/mocks/cuadrilla.mocks";
import { TIPOS_MOCK } from "@/mocks/tipos-reportes.mock";
import {
  actualizarReporteOperador,
  obtenerReporteOperadorPorId,
  obtenerReportesOperador,
} from "@/servicios/reportes";
import type {
  CambiosDetalleOperador,
  CatalogosDetalleOperador,
  DetalleReclamoOperador,
} from "@/tipos/detalleOperador.interface";
import type { ReclamoOperador } from "@/tipos/operador.interface";
import type { Reporte } from "@/tipos/reporte.interface";

const nombreZona = (zonaId: string) =>
  zonaId.replace("zon-", "").replace(/^./, (letra) => letra.toUpperCase());

const desdeReporte = (reporte: Reporte): DetalleReclamoOperador => ({
  id: reporte.id,
  codigo: reporte.codigo,
  tipo: TIPOS_MOCK.find((tipo) => tipo.id === reporte.tipoId)?.nombre ?? "Reporte",
  direccion: reporte.direccion,
  zona: nombreZona(reporte.zonaId),
  estado: reporte.estado,
  creadoEn: reporte.creadoEn,
  adhesiones: reporte.adhesiones,
  descripcion: reporte.descripcion ?? "",
  cuadrillaId: reporte.cuadrillaId,
  fotoProblema: reporte.fotos.find((foto) => foto.momento === "problema")?.url ?? null,
  fotoArreglo: reporte.fotos.find((foto) => foto.momento === "arreglo")?.url ?? null,
  duplicadoDe: reporte.duplicadoDe,
  historial: reporte.historial.map((cambio) => ({ ...cambio })),
});

export async function obtenerDetallesOperador(): Promise<DetalleReclamoOperador[]> {
  const reportes = await obtenerReportesOperador();
  return reportes.map(desdeReporte);
}

export async function obtenerDetalleOperador(reclamoId: string): Promise<DetalleReclamoOperador> {
  return desdeReporte(await obtenerReporteOperadorPorId(reclamoId));
}

export async function obtenerCatalogosDetalleOperador(): Promise<CatalogosDetalleOperador> {
  const [reportes, cuadrillas] = await Promise.all([
    obtenerReportesOperador(),
    Promise.resolve(mock_cuadrilla.filter((cuadrilla) => cuadrilla.activa)),
  ]);
  const lista = reportes.map(desdeReporte);
  const reportesLista: ReclamoOperador[] = lista.map(
    ({
      cuadrillaId: _cuadrillaId,
      fotoProblema: _fotoProblema,
      fotoArreglo: _fotoArreglo,
      duplicadoDe: _duplicadoDe,
      historial: _historial,
      ...reclamo
    }) => reclamo
  );
  return { cuadrillas, reportes: reportesLista };
}

export async function buscarDetalleOperadorPorQr(valorQr: string): Promise<DetalleReclamoOperador> {
  const referenciaQr = valorQr.trim().split(/[/?#=]/).filter(Boolean).pop()?.toLocaleLowerCase();
  const detalles = await obtenerDetallesOperador();
  const detalle = detalles.find(
    (actual) =>
      actual.id.toLocaleLowerCase() === referenciaQr ||
      actual.codigo.toLocaleLowerCase() === referenciaQr
  );
  if (!detalle) {
    throw new Error("El QR no corresponde a un reclamo de esta bandeja.");
  }
  return detalle;
}

export async function guardarCambiosDetalleOperador(
  reclamoId: string,
  cambios: CambiosDetalleOperador
): Promise<DetalleReclamoOperador> {
  const actualizado = await actualizarReporteOperador(reclamoId, cambios);
  return desdeReporte(actualizado);
}
