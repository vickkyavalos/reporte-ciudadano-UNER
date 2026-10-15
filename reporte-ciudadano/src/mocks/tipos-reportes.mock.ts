import type { TipoDeReporte } from "@/tipos/reporte.interface";

export const TIPOS_MOCK: TipoDeReporte[] = [
  { id: "tip-bache", nombre: "Bache", icono: "construct-outline", color: "#C1440E", areaResponsable: "Obras Públicas" },
  { id: "tip-luminaria", nombre: "Luminaria rota", icono: "bulb-outline", color: "#B45309", areaResponsable: "Alumbrado" },
  { id: "tip-basura", nombre: "Basura acumulada", icono: "trash-outline", color: "#4D7C0F", areaResponsable: "Higiene Urbana" },
  { id: "tip-rama", nombre: "Rama o árbol", icono: "leaf-outline", color: "#15803D", areaResponsable: "Espacios Verdes" },
  { id: "tip-agua", nombre: "Agua o cloaca", icono: "water-outline", color: "#0369A1", areaResponsable: "Obras Sanitarias" },
  { id: "tip-semaforo", nombre: "Semáforo", icono: "alert-circle-outline", color: "#B91C1C", areaResponsable: "Tránsito" },
  { id: "tip-vereda", nombre: "Vereda", icono: "walk-outline", color: "#6D28D9", areaResponsable: "Obras Públicas" },
  { id: "tip-otro", nombre: "Otro", icono: "ellipsis-horizontal-outline", color: "#4B5563", areaResponsable: "Atención al Vecino" },
];
