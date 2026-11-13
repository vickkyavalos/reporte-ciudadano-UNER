import type { EstadoReporte } from "@/tipos/reporte.interface";

export interface ReclamoOperador {
  id: string;
  codigo: string;
  tipo: string;
  direccion: string;
  zona: string;
  estado: EstadoReporte;
  creadoEn: string;
  adhesiones: number;
  descripcion: string;
}

export type FiltroEstadoOperador = EstadoReporte | "todos";
export type CampoFiltroOperador = "estado" | "tipo" | "zona";
export type OrdenBandejaOperador = "adhesiones" | "recientes" | "antiguos";
