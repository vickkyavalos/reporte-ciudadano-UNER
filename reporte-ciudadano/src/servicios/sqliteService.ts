import * as SQLite from "expo-sqlite";

let base: Promise<SQLite.SQLiteDatabase> | null = null;

/** Versión del esquema. Cada cambio de tablas suma 1 y agrega su paso en `migrar`. */
const VERSION = 1;

/**
 * Migraciones con PRAGMA user_version (Unidad 5): la base sobrevive a las actualizaciones de la
 * app, así que un teléfono con una versión vieja tiene que poder llegar a la nueva paso a paso.
 */
async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let actual = fila?.user_version ?? 0;
  if (actual >= VERSION) return;

  if (actual === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cola_reportes (
        id TEXT PRIMARY KEY NOT NULL,
        autor_id TEXT NOT NULL,
        creado_en TEXT NOT NULL,
        datos TEXT NOT NULL
      );
    `);
    actual = 1;
  }
  // if (actual === 1) { ...la próxima migración va acá...; actual = 2; }

  await db.execAsync(`PRAGMA user_version = ${VERSION}`);
}

async function abrir(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("reporte-ciudadano.db");
  await migrar(db);
  return db;
}

export function obtenerDb(): Promise<SQLite.SQLiteDatabase> {
  base ??= abrir().catch((error) => {
    base = null;
    throw error;
  });
  return base;
}
