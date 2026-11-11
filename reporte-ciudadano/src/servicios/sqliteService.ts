import * as SQLite from 'expo-sqlite';

// let db: SQLite.SQLiteDatabase | null = null;

// export async function obtenerDb() {
// 	if (!db) {
// 		db = await SQLite.openDatabaseAsync('reportes.db');
// 		await db.execAsync(`
// 			CREATE TABLE IF NOT EXISTS cola_reportes (
// 				id TEXT PRIMARY KEY NOT NULL,
// 				payload TEXT NOT NULL,
// 				creadoEn TEXT NOT NULL
// 			);
// 		`);
// 	}
// 	return db;
// }

// export async function encolarReporte(id: string, payload: unknown) {
// 	const d = await obtenerDb();
// 	await d.runAsync(
// 		'INSERT OR REPLACE INTO cola_reportes (id, payload, creadoEn) VALUES (?, ?, ?)',
// 		id, JSON.stringify(payload), new Date().toISOString()
// 	);
// }

// export async function obtenerCola() {
// 	const d = await obtenerDb();
// 	return d.getAllAsync<{ id: string; payload: string; creadoEn: string }>(
// 		'SELECT * FROM cola_reportes ORDER BY creadoEn ASC'
// 	);
// }

// export async function quitarDeCola(id: string) {
// 	const d = await obtenerDb();
// 	await d.runAsync('DELETE FROM cola_reportes WHERE id = ?', id);
// }