import type { Coordenadas } from "@/tipos/reporte.interface";

// de fecha a texto
export function haceCuanto(iso: string, ahora: string | Date = new Date()): string {
  const fechaActual = typeof ahora === "string" ? new Date(ahora) : ahora;
  const minutos = Math.max(0, Math.floor((fechaActual.getTime() - new Date(iso).getTime()) / 60000));
  
  if (minutos < 1) return "Recién";
  if (minutos < 60) return `Hace ${minutos} min`;
  
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

// Argentina no cambia de hora: el offset es siempre -03:00.
export function ahoraIsoArgentina(ahora: Date = new Date()): string {
  const local = new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}-03:00`;
}

export function generarId(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

//cuantos metros hay
export function distanciaMetros(a: Coordenadas, b: Coordenadas): number {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}