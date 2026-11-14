import type { DetalleReclamoOperador } from "@/tipos/detalleOperador.interface";
import type { EstadoReporte } from "@/tipos/reporte.interface";

const reclamosBase: Omit<
  DetalleReclamoOperador,
  "id" | "codigo" | "creadoEn" | "historial"
>[] = [
  {
    tipo: "Bache",
    direccion: "Rocamora 1240",
    zona: "Centro",
    estado: "en_revision",
    adhesiones: 14,
    descripcion: "Bache profundo sobre la calzada, dificulta la circulación.",
    cuadrillaId: null,
    fotoProblema: "https://api.gchu.gob.ar/f/901.jpg",
    fotoArreglo: null,
    duplicadoDe: null,
  },
  {
    tipo: "Luz",
    direccion: "Plaza San Martín",
    zona: "Centro",
    estado: "en_revision",
    adhesiones: 8,
    descripcion: "Luminaria apagada en el sendero central de la plaza.",
    cuadrillaId: null,
    fotoProblema: "https://api.gchu.gob.ar/f/902.jpg",
    fotoArreglo: null,
    duplicadoDe: null,
  },
  {
    tipo: "Residuos",
    direccion: "San José 680",
    zona: "Norte",
    estado: "recibido",
    adhesiones: 5,
    descripcion: "Residuos acumulados junto al contenedor.",
    cuadrillaId: null,
    fotoProblema: "https://api.gchu.gob.ar/f/903.jpg",
    fotoArreglo: null,
    duplicadoDe: null,
  },
  {
    tipo: "Pluviales",
    direccion: "Av. Colón 320",
    zona: "Sur",
    estado: "en_revision",
    adhesiones: 11,
    descripcion: "El desagüe pluvial se encuentra obstruido.",
    cuadrillaId: null,
    fotoProblema: "https://api.gchu.gob.ar/f/904.jpg",
    fotoArreglo: null,
    duplicadoDe: null,
  },
  {
    tipo: "Vereda",
    direccion: "Frente al hospital",
    zona: "Oeste",
    estado: "resuelto",
    adhesiones: 3,
    descripcion: "Vereda reparada frente al ingreso principal del hospital.",
    cuadrillaId: "cua-02",
    fotoProblema: "https://api.gchu.gob.ar/f/905.jpg",
    fotoArreglo: "https://api.gchu.gob.ar/f/905-arreglo.jpg",
    duplicadoDe: null,
  },
  {
    tipo: "Agua",
    direccion: "Urquiza 940",
    zona: "Centro",
    estado: "recibido",
    adhesiones: 6,
    descripcion: "Pérdida de agua sobre la vereda.",
    cuadrillaId: null,
    fotoProblema: "https://api.gchu.gob.ar/f/906.jpg",
    fotoArreglo: null,
    duplicadoDe: null,
  },
];

export const DETALLES_OPERADOR_MOCK: DetalleReclamoOperador[] = Array.from(
  { length: 24 },
  (_, indice) => {
    const referencia = reclamosBase[indice % reclamosBase.length];
    const diasAtras = (indice % reclamosBase.length) * 2 + Math.floor(indice / reclamosBase.length) * 7;
    const creadoEn = new Date(Date.UTC(2026, 7, 12 - diasAtras)).toISOString();
    const estadoInicial: EstadoReporte = referencia.estado;
    const id =
      indice < 3
        ? `rep-${String(412 + indice).padStart(5, "0")}`
        : `reclamo-${indice + 1}`;

    return {
      ...referencia,
      estado: indice === 2 ? "rechazado" : referencia.estado,
      id,
      codigo: `GCHU-2026-${String(412 + indice).padStart(5, "0")}`,
      creadoEn,
      historial:
        indice === 0
          ? [
              { id: "cambio-1", reporteId: id, estado: "recibido", comentario: "Ingreso del reclamo.", operadorId: null, fechaHora: creadoEn },
              { id: "cambio-2", reporteId: id, estado: "en_revision", comentario: "Se verificó la ubicación del bache.", operadorId: "operador-demo", fechaHora: creadoEn },
              { id: "cambio-3", reporteId: id, estado: "asignado", comentario: "Asignado a cuadrilla de bacheo.", operadorId: "operador-demo", fechaHora: creadoEn },
              { id: "cambio-4", reporteId: id, estado: "en_revision", comentario: "Se solicitó una inspección adicional.", operadorId: "operador-demo", fechaHora: creadoEn },
              { id: "cambio-5", reporteId: id, estado: estadoInicial, comentario: "Pendiente de confirmación de los trabajos.", operadorId: "operador-demo", fechaHora: creadoEn },
            ]
          : indice === 2
            ? [
                {
                  id: `cambio-inicial-${indice + 1}`,
                  reporteId: id,
                  estado: "rechazado",
                  comentario:
                    "El inconveniente informado se encuentra dentro de un terreno de propiedad privada y no corresponde a la jurisdicción municipal. Se recomienda contactar a la administración responsable para coordinar la intervención.",
                  operadorId: "operador-demo",
                  fechaHora: creadoEn,
                },
              ]
            : [
                {
                  id: `cambio-inicial-${indice + 1}`,
                  reporteId: id,
                  estado: estadoInicial,
                  comentario: "Ingreso del reclamo a la bandeja de operador.",
                  operadorId: null,
                  fechaHora: creadoEn,
                },
              ],
    };
  }
);
