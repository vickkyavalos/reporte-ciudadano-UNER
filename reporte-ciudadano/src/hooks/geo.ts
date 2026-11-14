import type { Coordenadas, Reporte } from "@/tipos/reporte.interface";
import type { Zona } from "@/tipos/zona.interface";


const RADIO_TIERRA = 6371000;
const rad = (g: number) => (g * Math.PI) / 180;

export function distanciaMetros(a: Coordenadas, b: Coordenadas): number {
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(h));
}

export function puntoEnPoligono(p: Coordenadas, poligono: Coordenadas[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i];
    const b = poligono[j];
    const cruza =
      a.latitud > p.latitud !== b.latitud > p.latitud &&
      p.longitud <
        ((b.longitud - a.longitud) * (p.latitud - a.latitud)) / (b.latitud - a.latitud) + a.longitud;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

function distanciaAlBorde(p: Coordenadas, poligono: Coordenadas[]): number {
  const kx = Math.cos(rad(p.latitud)) * 111320;
  const ky = 110540;
  const aMetros = (c: Coordenadas) => ({
    x: (c.longitud - p.longitud) * kx,
    y: (c.latitud - p.latitud) * ky,
  });
  let min = Infinity;
  for (let i = 0; i < poligono.length; i++) {
    const a = aMetros(poligono[i]);
    const b = aMetros(poligono[(i + 1) % poligono.length]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / largo2));
    min = Math.min(min, Math.hypot(a.x + t * dx, a.y + t * dy));
  }
  return min;
}

export function asignarZona(p: Coordenadas, zonas: Zona[], toleranciaM = 500): string | null {
  const contenedora = zonas.find((z) => puntoEnPoligono(p, z.limite));
  if (contenedora) return contenedora.id;

  let mejor: { id: string; dist: number } | null = null;
  for (const z of zonas) {
    const dist = distanciaAlBorde(p, z.limite);
    if (dist <= toleranciaM && (!mejor || dist < mejor.dist)) mejor = { id: z.id, dist };
  }
  return mejor?.id ?? null;
}

export function reportesCercanos(
  p: Coordenadas,
  tipoId: string,
  reportes: Reporte[],
  radioM = 50,
): Reporte[] {
  return reportes
    .filter(
      (r) =>
        r.tipoId === tipoId &&
        r.estado !== "resuelto" &&
        r.estado !== "rechazado" &&
        r.duplicadoDe === null &&
        distanciaMetros(p, r.coordenadas) <= radioM,
    )
    .sort((a, b) => distanciaMetros(p, a.coordenadas) - distanciaMetros(p, b.coordenadas));
}