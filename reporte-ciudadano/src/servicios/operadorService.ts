import { obtenerDetallesOperador } from "@/servicios/detalleOperadorService";
import type { ReclamoOperador } from "@/tipos/operador.interface";

export async function obtenerReclamosOperador(): Promise<ReclamoOperador[]> {
  const detalles = await obtenerDetallesOperador();
  return detalles.map(
    ({
      cuadrillaId: _cuadrillaId,
      fotoProblema: _fotoProblema,
      fotoArreglo: _fotoArreglo,
      duplicadoDe: _duplicadoDe,
      historial: _historial,
      ...reclamo
    }) => reclamo
  );
}
