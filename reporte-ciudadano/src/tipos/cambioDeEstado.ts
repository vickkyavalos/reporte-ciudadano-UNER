import type { EstadoReporte } from "./reporte.interface";

export interface CambioDeEstado {
  id: string;
  reporteId: string;
  estado: EstadoReporte;
  comentario: string | null;
  operadorId: string | null;
  fechaHora: string;

}