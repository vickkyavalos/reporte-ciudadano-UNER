import { obtenerDb } from "@/servicios/sqliteService";
import type { Reporte } from "@/tipos/reporte.interface";

export interface EntradaCola {
  reporte: Reporte;
  direccionPendiente: boolean;
  // Ruta local -> URL devuelta por el servidor, para no volver a subir un
  // archivo si la conexión se corta a mitad del envío.
  archivosSubidos: Record<string, string>;
  ultimoError: string | null;
}

interface Fila {
  datos: string;
}

const oyentes = new Set<() => void>();

export function suscribirCola(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

function avisar() {
  oyentes.forEach((oyente) => oyente());
}

export async function encolar(entrada: EntradaCola): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO cola_reportes (id, autor_id, creado_en, datos) VALUES (?, ?, ?, ?)",
    entrada.reporte.id,
    entrada.reporte.autorId,
    entrada.reporte.creadoEn,
    JSON.stringify(entrada),
  );
  avisar();
}

export async function listarCola(autorId: string): Promise<EntradaCola[]> {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<Fila>(
    "SELECT datos FROM cola_reportes WHERE autor_id = ? ORDER BY creado_en ASC",
    autorId,
  );
  return filas.map((fila) => JSON.parse(fila.datos) as EntradaCola);
}

export async function obtenerDeCola(id: string): Promise<EntradaCola | null> {
  const db = await obtenerDb();
  const fila = await db.getFirstAsync<Fila>("SELECT datos FROM cola_reportes WHERE id = ?", id);
  return fila ? (JSON.parse(fila.datos) as EntradaCola) : null;
}

export async function actualizarEntrada(entrada: EntradaCola): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync(
    "UPDATE cola_reportes SET datos = ? WHERE id = ?",
    JSON.stringify(entrada),
    entrada.reporte.id,
  );
}

export async function quitarDeCola(id: string): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync("DELETE FROM cola_reportes WHERE id = ?", id);
  avisar();
}
