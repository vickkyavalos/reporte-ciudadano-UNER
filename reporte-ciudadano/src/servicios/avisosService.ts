import { AVISOS_MOCK } from "@/mocks/avisos.mock";
import { mock_usuario } from "@/mocks/usuario.mocks";
import type { AvisoVecino, TipoAvisoVecino } from "@/tipos/aviso.interface";
import type { EstadoReporte } from "@/tipos/reporte.interface";

let avisos = AVISOS_MOCK.map((aviso) => ({ ...aviso }));

export async function registrarAvisoDeEstado(
  destinatarioId: string,
  reporteId: string,
  estado: EstadoReporte
): Promise<void> {
  const estadoAvisos = {
    recibido: "recibido",
    en_revision: "en revisión",
    asignado: "asignado",
    resuelto: "resuelto",
    rechazado: "rechazado",
  } satisfies Record<EstadoReporte, string>;
  await registrarAviso(
    destinatarioId,
    reporteId,
    "cambio_estado",
    "Cambió el estado de tu reclamo",
    `Tu reclamo ahora está ${estadoAvisos[estado]}.`
  );
}

export async function registrarAvisoDeAdhesion(
  destinatarioId: string,
  reporteId: string
): Promise<void> {
  await registrarAviso(
    destinatarioId,
    reporteId,
    "adhesion",
    "Se sumaron a tu reclamo",
    "Una persona más se sumó a un reclamo que creaste."
  );
}

export async function obtenerAvisosUsuario(usuarioId: string): Promise<AvisoVecino[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return avisos
    .filter((aviso) => aviso.destinatarioId === usuarioId)
    .map((aviso) => ({ ...aviso }));
}

async function registrarAviso(
  destinatarioId: string,
  reporteId: string,
  tipo: TipoAvisoVecino,
  titulo: string,
  mensaje: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const destinatario = mock_usuario.find((usuario) => usuario.id === destinatarioId);
  if (destinatario && !destinatario.avisosActivos) return;

  avisos = [
    {
      id: `aviso-${Date.now()}`,
      destinatarioId,
      reporteId,
      tipo,
      titulo,
      mensaje,
      fechaHora: new Date().toISOString(),
      leido: false,
    },
    ...avisos,
  ];
}
