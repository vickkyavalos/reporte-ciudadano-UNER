export type TipoAvisoVecino = "cambio_estado" | "adhesion";

export interface AvisoVecino {
  id: string;
  destinatarioId: string;
  reporteId: string;
  tipo: TipoAvisoVecino;
  titulo: string;
  mensaje: string;
  fechaHora: string;
  leido: boolean;
}
