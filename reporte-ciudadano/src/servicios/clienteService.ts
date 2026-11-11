import { Platform } from 'react-native';
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

export const guardarToken = async (t: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', t);
    return;
  }
  await SecureStore.setItemAsync('token', t);
};

export const obtenerToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  }
  return SecureStore.getItemAsync('token');
};

export const borrarToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
    return;
  }
  await SecureStore.deleteItemAsync('token');
};

type Opciones = { metodo?: string; cuerpo?: unknown; formData?: FormData };

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

  let res: Response;
  try {
    res = await fetch(`${BASE}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers,
      body: opciones.formData ?? (opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined),
    });
  } catch {
    throw new ErrorApi('SIN_CONEXION', 'No hay conexión. Probá de nuevo.', 0);
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