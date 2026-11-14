import type { CambioDeEstado } from "@/tipos/cambioDeEstado";
import type { Cuadrilla } from "@/tipos/cuadrilla.interface";
import type { ReclamoOperador } from "@/tipos/operador.interface";
import type { CambiosOperadorReporte } from "@/tipos/reporte.interface";

export interface DetalleReclamoOperador extends ReclamoOperador {
  zonaId?: string;
  cuadrillaId: string | null;
  fotoProblema: string | null;
  fotoArreglo: string | null;
  fotosArreglo?: string[];
  duplicadoDe: string | null;
  historial: CambioDeEstado[];
  audioUrl: string | null;
}

export type CambiosDetalleOperador = Omit<CambiosOperadorReporte, "fotoArreglo"> & {
  fotosArreglo: string[];
};

export interface CatalogosDetalleOperador {
  cuadrillas: Cuadrilla[];
  reportes: ReclamoOperador[];
}
