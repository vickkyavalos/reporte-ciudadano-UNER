import type { EstadoReporte } from "@/tipos/reporte.interface";

export const ESTADOS: Record<
  EstadoReporte,
  { etiqueta: string; fondo: string; texto: string; borde: string; pin: string }
> = {
  recibido: { etiqueta: "Recibido", fondo: "#F3F4F6", texto: "#4B5563", borde: "#D1D5DB", pin: "#6B7280" },
  en_revision: { etiqueta: "En revisión", fondo: "#FEF3E2", texto: "#B45309", borde: "#F5C27A", pin: "#F59E0B" },
  asignado: { etiqueta: "Asignado", fondo: "#E8F0FE", texto: "#1D4ED8", borde: "#A9C3F7", pin: "#2563EB" },
  resuelto: { etiqueta: "Resuelto", fondo: "#E6F6EC", texto: "#15803D", borde: "#9AD6B0", pin: "#16A34A" },
  rechazado: { etiqueta: "Rechazado", fondo: "#FDECEC", texto: "#B91C1C", borde: "#F3AAAA", pin: "#DC2626" },
};

export const COLORES = {
  fondo: "#F3F4F6",
  superficie: "#FFFFFF",
  texto: "#111827",
  textoSuave: "#6B7280",
  primario: "#111827",
  linea: "#E5E7EB",
};
