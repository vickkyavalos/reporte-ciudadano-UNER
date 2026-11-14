import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const CLAVE_TOKEN = 'token';

const BASE = process.env.EXPO_PUBLIC_API_URL;

const SIMULAR = process.env.EXPO_PUBLIC_SIMULAR;

const TIMEOUT_POR_DEFECTO_MS = 60000;

export class ErrorApi extends Error {
  mensaje: string;
  status?: number;
  constructor(public codigo: string, mensaje: string, status?: number) {
    super(mensaje);
    this.mensaje = mensaje;
    this.status = status;
  }
  get estado(): number {
    return this.status ?? 0;
  }
}

let alExpirarSesion: (() => void) | null = null;
export const onSesionExpirada = (fn: () => void) => {
  alExpirarSesion = fn;
};

export const guardarToken = async (t: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(CLAVE_TOKEN, t);
    return;
  }
  await SecureStore.setItemAsync(CLAVE_TOKEN, t);
};

export const obtenerToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(CLAVE_TOKEN);
  }
  return SecureStore.getItemAsync(CLAVE_TOKEN);
};

export const borrarToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(CLAVE_TOKEN);
    return;
  }
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
};


export const api = axios.create({
  baseURL: BASE,
  timeout: TIMEOUT_POR_DEFECTO_MS,
});

api.interceptors.request.use(async (config) => {
  if (!BASE) {
    throw new ErrorApi('SIN_CONFIGURAR', 'Falta EXPO_PUBLIC_API_URL en el .env');
  }
  const token = await obtenerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (SIMULAR && !config.headers['X-Simular']) config.headers['X-Simular'] = SIMULAR;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err instanceof ErrorApi) throw err;

    if (axios.isAxiosError(err) && err.response) {
      const { status, data, config } = err.response;
      if (status === 401 && config.headers?.Authorization) alExpirarSesion?.();

      const e = data?.error;
      if (e) throw new ErrorApi(e.codigo, e.mensaje, status);
      throw new ErrorApi(
        'ERROR_HTTP',
        `La API respondió con un error HTTP ${status}.`,
        status
      );
    }

    throw new ErrorApi('SIN_CONEXION', 'No pudimos conectarnos. Revise su conexión.');
  }
);

type Opciones = {
  metodo?: string;
  cuerpo?: unknown;
  formData?: FormData;
  timeoutMs?: number;
  simular?: 'error-500' | 'demora-3000'; // solo pruebas
};

export async function pedir<T>(
  ruta: string,
  opciones: Opciones = {}
): Promise<{ datos: T; meta: any }> {

  if (opciones.formData) {
    if (!BASE) throw new ErrorApi('SIN_CONFIGURAR', 'Falta EXPO_PUBLIC_API_URL en el .env');
    const token = await obtenerToken();
    const corte = new AbortController();
    const temporizador = setTimeout(() => corte.abort(), opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS);
    let res: Response;
    try {
      res = await fetch(`${BASE}${ruta}`, {
        method: opciones.metodo ?? 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: opciones.formData,
        signal: corte.signal,
      });
    } catch {
      throw new ErrorApi('SIN_CONEXION', 'No pudimos conectarnos. Revise su conexión.');
    } finally {
      clearTimeout(temporizador);
    }
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && token) alExpirarSesion?.();
      throw new ErrorApi(
        json?.error?.codigo ?? 'ERROR_HTTP',
        json?.error?.mensaje ?? `La API respondió con un error HTTP ${res.status}.`,
        res.status
      );
    }
    return json;
  }

  const respuesta = await api.request<{ datos: T; meta: any }>({
    url: ruta,
    method: opciones.metodo ?? 'GET',

    data: opciones.formData ?? opciones.cuerpo,
    timeout: opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS,
    headers: opciones.simular ? { 'X-Simular': opciones.simular } : undefined,
  });
  return respuesta.data;
}
