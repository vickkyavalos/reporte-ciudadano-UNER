import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_URL;

export class ErrorApi extends Error {
  mensaje: string;
  constructor(public codigo: string, mensaje: string, public estado: number) {
    super(mensaje);
    this.mensaje = mensaje;
  }
}

let alExpirarSesion: (() => void) | null = null;
export const onSesionExpirada = (fn: () => void) => {
  alExpirarSesion = fn;
};

export const guardarToken = (t: string) => SecureStore.setItemAsync('token', t);
export const obtenerToken = () => SecureStore.getItemAsync('token');
export const borrarToken = () => SecureStore.deleteItemAsync('token');

type Opciones = { metodo?: string; cuerpo?: unknown; formData?: FormData; timeoutMs?: number };

export async function pedir<T>(
  ruta: string,
  opciones: Opciones = {}
): Promise<{ datos: T; meta: any }> {
  if (!BASE) {
    throw new ErrorApi('SIN_CONFIGURAR', 'Falta EXPO_PUBLIC_API_URL en el .env', 0);
  }

  const token = await obtenerToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opciones.cuerpo) headers['Content-Type'] = 'application/json';

  const corte = new AbortController();
  const temporizador = opciones.timeoutMs
    ? setTimeout(() => corte.abort(), opciones.timeoutMs)
    : null;

  let res: Response;
  try {
    res = await fetch(`${BASE}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers,
      body: opciones.formData ?? (opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined),
      signal: corte.signal,
    });
  } catch {
    throw new ErrorApi('SIN_CONEXION', 'No hay conexión. Probá de nuevo.', 0);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token) alExpirarSesion?.();
    throw new ErrorApi(
      json?.error?.codigo ?? 'ERROR_INTERNO',
      json?.error?.mensaje ?? 'Algo salió mal.',
      res.status
    );
  }
  return json;
}