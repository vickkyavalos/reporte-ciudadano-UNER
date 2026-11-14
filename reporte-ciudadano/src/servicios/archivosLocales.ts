import { Directory, File, Paths } from "expo-file-system";
import { generarId } from "@/utils/formato";

export const LIMITE_FOTO_BYTES = 5 * 1024 * 1024;

const NOMBRE_CARPETA = "pendientes";

function carpetaPendientes(): Directory {
  const carpeta = new Directory(Paths.document, NOMBRE_CARPETA);
  carpeta.create({ idempotent: true, intermediates: true });
  return carpeta;
}

export function abrirArchivoLocal(uri: string): File {
  const marca = `/${NOMBRE_CARPETA}/`;
  const posicion = uri.lastIndexOf(marca);
  if (posicion === -1) return new File(uri);
  return new File(Paths.document, NOMBRE_CARPETA, uri.slice(posicion + marca.length));
}

export async function guardarArchivoLocal(
  uri: string,
  prefijo: "fot" | "aud",
  extension: string,
): Promise<string> {
  const destino = new File(carpetaPendientes(), `${generarId(prefijo)}.${extension}`);
  await new File(uri).copy(destino);
  return destino.uri;
}

export function existeArchivoLocal(uri: string): boolean {
  return abrirArchivoLocal(uri).exists;
}

export function tamanoArchivoLocal(uri: string): number {
  return new File(uri).size ?? 0;
}

export function borrarArchivoLocal(uri: string): void {
  try {
    const archivo = abrirArchivoLocal(uri);
    if (archivo.exists) archivo.delete();
  } catch {
  }
}
