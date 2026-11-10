import type { Reporte } from "@/tipos/reporte.interface";

const hace = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString();

export const REPORTES_MOCK: Reporte[] = [
  {
    id: "rep-00412", codigo: "GCHU-2026-00412", tipoId: "tip-bache",
    descripcion: "Pozo grande en la mano hacia el centro, pasa el agua.",
    audioUrl: null, // caso feo: sin audio
    fotos: [{ id: "fot-901", url: "https://api.gchu.gob.ar/f/901.jpg", momento: "problema" }],
    coordenadas: { latitud: -33.0089, longitud: -58.5142 },
    direccion: "Av. San Martín 1240", zonaId: "zon-norte", estado: "asignado",
    autorId: "usr-084", cuadrillaId: "cua-02", duplicadoDe: null, adhesiones: 3,
    creadoEn: hace(2), sincronizado: true,
    historial: [{ id: "hist-412", reporteId: "rep-00412", estado: "asignado", comentario: "Asignado a la cuadrilla de bacheo.", operadorId: "usr-003", fechaHora: hace(1) }],
    comentarioCierre: null,
  },
  {
    id: "rep-00413", codigo: "GCHU-2026-00413", tipoId: "tip-luminaria",
    descripcion: "Hace una semana que la esquina está a oscuras.",
    audioUrl: "file:///mock/audio-413.m4a",
    fotos: [{ id: "fot-902", url: "https://api.gchu.gob.ar/f/902.jpg", momento: "problema" }],
    coordenadas: { latitud: -33.0102, longitud: -58.5121 },
    direccion: "Rocamora y Bolívar", zonaId: "zon-norte", estado: "en_revision",
    autorId: "usr-031", cuadrillaId: null, duplicadoDe: null, adhesiones: 1,
    creadoEn: hace(4), sincronizado: true,
    historial: [{ id: "hist-413", reporteId: "rep-00413", estado: "en_revision", comentario: "Se verificará la luminaria.", operadorId: "usr-003", fechaHora: hace(3) }],
    comentarioCierre: null,
  },
  {
    id: "rep-00414", codigo: "GCHU-2026-00414", tipoId: "tip-basura",
    descripcion: null, audioUrl: null,
    fotos: [{ id: "fot-903", url: "https://api.gchu.gob.ar/f/903.jpg", momento: "problema" }],
    coordenadas: { latitud: -33.0071, longitud: -58.5169 },
    direccion: "Urquiza 1200", zonaId: "zon-norte", estado: "recibido",
    autorId: "usr-112", cuadrillaId: null, duplicadoDe: null, adhesiones: 0,
    creadoEn: hace(1), sincronizado: true,
    historial: [{ id: "hist-414", reporteId: "rep-00414", estado: "recibido", comentario: null, operadorId: null, fechaHora: hace(1) }],
    comentarioCierre: null,
  },
  {
    id: "rep-00398", codigo: "GCHU-2026-00398", tipoId: "tip-rama",
    descripcion: "Rama sobre el cable.", audioUrl: null,
    fotos: [
      { id: "fot-880", url: "https://api.gchu.gob.ar/f/880.jpg", momento: "problema" },
      { id: "fot-880-arreglo", url: "https://api.gchu.gob.ar/f/880-arreglo.jpg", momento: "arreglo" },
    ],
    coordenadas: { latitud: -33.0115, longitud: -58.5188 },
    direccion: "Calle Concordia 450", zonaId: "zon-centro", estado: "resuelto",
    autorId: "usr-054", cuadrillaId: "cua-04", duplicadoDe: null, adhesiones: 5,
    creadoEn: hace(12), sincronizado: true,
    historial: [{ id: "hist-398", reporteId: "rep-00398", estado: "resuelto", comentario: "Se retiró la rama y se aseguró el cableado.", operadorId: "usr-003", fechaHora: hace(8) }],
    comentarioCierre: "Se retiró la rama y se aseguró el cableado.",
  },
];
