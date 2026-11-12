import Storage from "expo-sqlite/kv-store";
import { existeArchivoLocal } from "@/servicios/archivosLocales";
import type { Coordenadas } from "@/tipos/reporte.interface";

export interface BorradorReporte {
  tipoId: string | null;
  fotosUris: string[];
  descripcion: string;
  audioUri: string | null;
  puntoManual: Coordenadas | null;
}

const clave = (autorId: string) => `borrador-reporte:${autorId}`;

export async function cargarBorrador(autorId: string): Promise<BorradorReporte | null> {
  const guardado = await Storage.getItem(clave(autorId));
  if (!guardado) return null;
  const borrador = JSON.parse(guardado) as BorradorReporte;
  return {
    ...borrador,
    fotosUris: borrador.fotosUris.filter(existeArchivoLocal),
    audioUri: borrador.audioUri && existeArchivoLocal(borrador.audioUri) ? borrador.audioUri : null,
  };
}

export async function guardarBorrador(autorId: string, borrador: BorradorReporte): Promise<void> {
  await Storage.setItem(clave(autorId), JSON.stringify(borrador));
}

export async function borrarBorrador(autorId: string): Promise<void> {
  await Storage.removeItem(clave(autorId));
}
