import type { EstadoReporte } from "@/tipos/reporte.interface";
import type { ReclamoOperador } from "@/tipos/operador.interface";

const reclamosBase: Omit<ReclamoOperador, "id" | "codigo" | "creadoEn">[] = [
  {
    tipo: "Bache",
    direccion: "Rocamora 1240",
    zona: "Centro",
    estado: "en_revision",
    adhesiones: 14,
    descripcion: "Bache profundo sobre la calzada, dificulta la circulación.",
  },
  {
    tipo: "Luz",
    direccion: "Plaza San Martín",
    zona: "Centro",
    estado: "en_revision",
    adhesiones: 8,
    descripcion: "Luminaria apagada en el sendero central de la plaza.",
  },
  {
    tipo: "Residuos",
    direccion: "San José 680",
    zona: "Norte",
    estado: "recibido",
    adhesiones: 5,
    descripcion: "Residuos acumulados junto al contenedor.",
  },
  {
    tipo: "Pluviales",
    direccion: "Av. Colón 320",
    zona: "Sur",
    estado: "en_revision",
    adhesiones: 11,
    descripcion: "El desagüe pluvial se encuentra obstruido.",
  },
  {
    tipo: "Vereda",
    direccion: "Frente al hospital",
    zona: "Oeste",
    estado: "resuelto",
    adhesiones: 3,
    descripcion: "Vereda reparada frente al ingreso principal del hospital.",
  },
  {
    tipo: "Agua",
    direccion: "Urquiza 940",
    zona: "Centro",
    estado: "recibido",
    adhesiones: 6,
    descripcion: "Pérdida de agua sobre la vereda.",
  },
];

const reclamos: ReclamoOperador[] = Array.from({ length: 24 }, (_, indice) => {
  const referencia = reclamosBase[indice % reclamosBase.length];
  const diasAtras = (indice % reclamosBase.length) * 2 + Math.floor(indice / reclamosBase.length) * 7;
  const creadoEn = new Date(Date.UTC(2026, 7, 12 - diasAtras)).toISOString();

  return {
    ...referencia,
    id: `reclamo-${indice + 1}`,
    codigo: `GCHU-2026-${String(412 + indice).padStart(5, "0")}`,
    creadoEn,
  };
});

export async function obtenerReclamosOperador(): Promise<ReclamoOperador[]> {
  return reclamos.map((reclamo) => ({ ...reclamo }));
}

export async function actualizarEstadoReclamoOperador(
  reclamoId: string,
  estado: EstadoReporte
): Promise<ReclamoOperador> {
  const indice = reclamos.findIndex((reclamo) => reclamo.id === reclamoId);
  if (indice === -1) {
    throw new Error(`No se encontró el reclamo ${reclamoId}.`);
  }

  reclamos[indice] = { ...reclamos[indice], estado };
  return { ...reclamos[indice] };
}
