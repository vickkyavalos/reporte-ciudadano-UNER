import type { CambioDeEstado } from "@/tipos/cambioDeEstado";
import type { Cuadrilla } from "@/tipos/cuadrilla.interface";
import type { ReclamoOperador } from "@/tipos/operador.interface";
import type { CambiosOperadorReporte } from "@/tipos/reporte.interface";

export interface DetalleReclamoOperador extends ReclamoOperador {
  zonaId?: string;
  cuadrillaId: string | null;
  fotoProblema: string | null;
  fotoArreglo: string | null;
  duplicadoDe: string | null;
  historial: CambioDeEstado[];
}

export type CambiosDetalleOperador = CambiosOperadorReporte;

export interface CatalogosDetalleOperador {
  cuadrillas: Cuadrilla[];
  reportes: ReclamoOperador[];
}
