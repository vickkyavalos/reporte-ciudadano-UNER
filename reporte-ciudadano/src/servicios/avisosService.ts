import { api } from "./api";
import type { AvisoVecino } from "@/tipos/aviso.interface";
import type {
  EstadoReporte,
  Reporte,
} from "@/tipos/reporte.interface";
import { CambioDeEstado } from "@/tipos/cambioDeEstado";
 
const MAX_REPORTES = 5;
 
const TEXTO_ESTADO: Record<EstadoReporte, string | null> = {
  recibido: null,
  en_revision: "está en revisión.",
  asignado: "fue asignado a una cuadrilla.",
  resuelto: "fue resuelto.",
  rechazado: "fue rechazado.",
};
 
async function obtenerCambios(reporteId: string): Promise<CambioDeEstado[]> {
  try {
    const { data } = await api.get<{ datos: CambioDeEstado[] }>(
      `/reportes/${reporteId}/cambios`
    );
    return data.datos;
  } catch {
 
    return [];
  }
}
 
export async function obtenerAvisosUsuario(
  reportes: Reporte[]
): Promise<AvisoVecino[]> {
  const recientes = reportes.slice(0, MAX_REPORTES);
  const cambiosPorReporte = await Promise.all(
    recientes.map((r) => obtenerCambios(r.id))
  );
 
  const items: { fecha: string; aviso: AvisoVecino }[] = [];
 
  recientes.forEach((reporte, i) => {
    for (const cambio of cambiosPorReporte[i]) {
      const texto = TEXTO_ESTADO[cambio.estado];
      if (!texto) continue;
      items.push({
        fecha: cambio.fechaHora,
        aviso: {
          id: `cambio-${cambio.id}`,
          destinatarioId: reporte.autorId,
          reporteId: reporte.id,
          tipo: "cambio_estado",
          fechaHora: cambio.fechaHora,
          leido: false,
          titulo: `Reporte ${reporte.codigo}`,
          mensaje: `Tu reporte ${texto}${
            cambio.comentario ? ` ${cambio.comentario}` : ""
          }`,
        },
      });
    }
 
    if (reporte.adhesiones > 0) {
      items.push({
        fecha: reporte.creadoEn,
        aviso: {
          id: `adhesion-${reporte.id}`,
          destinatarioId: reporte.autorId,
          reporteId: reporte.id,
          tipo: "adhesion",
          fechaHora: reporte.creadoEn,
          leido: false,
          titulo: `Reporte ${reporte.codigo}`,
          mensaje:
            reporte.adhesiones === 1
              ? "Un vecino se sumó a tu reporte."
              : `Ya son ${reporte.adhesiones} vecinos sumados a tu reporte.`,
        },
      });
    }
  });
 
  return items
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((i) => i.aviso);
}
 
