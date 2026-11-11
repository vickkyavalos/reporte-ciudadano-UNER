import * as SQLite from "expo-sqlite";

let base: Promise<SQLite.SQLiteDatabase> | null = null;

async function abrir(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("reporte-ciudadano.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cola_reportes (
      id TEXT PRIMARY KEY NOT NULL,
      autor_id TEXT NOT NULL,
      creado_en TEXT NOT NULL,
      datos TEXT NOT NULL
    );
  `);
  return db;
}

export function obtenerDb(): Promise<SQLite.SQLiteDatabase> {
  base ??= abrir().catch((error) => {
    base = null;
    throw error;
  });
  return base;
}
