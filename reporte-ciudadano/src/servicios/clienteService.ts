// import axios from 'axios';
// import { Platform } from 'react-native';
// import * as SecureStore from 'expo-secure-store';

// const BASE = process.env.EXPO_PUBLIC_API_URL;

// const TIMEOUT_POR_DEFECTO_MS = 60000;

// export class ErrorApi extends Error {
//   mensaje: string;
//   constructor(public codigo: string, mensaje: string, public estado: number) {
//     super(mensaje);
//     this.mensaje = mensaje;
//   }
// }

// let alExpirarSesion: (() => void) | null = null;
// export const onSesionExpirada = (fn: () => void) => {
//   alExpirarSesion = fn;
// };

// export const guardarToken = async (t: string) => {
//   if (Platform.OS === 'web') {
//     localStorage.setItem('token', t);
//     return;
//   }
//   await SecureStore.setItemAsync('token', t);
// };

// export const obtenerToken = async (): Promise<string | null> => {
//   if (Platform.OS === 'web') {
//     return localStorage.getItem('token');
//   }
//   return SecureStore.getItemAsync('token');
// };

// export const borrarToken = async () => {
//   if (Platform.OS === 'web') {
//     localStorage.removeItem('token');
//     return;
//   }
//   await SecureStore.deleteItemAsync('token');
// };

// export const api = axios.create({
//   baseURL: BASE,
//   timeout: TIMEOUT_POR_DEFECTO_MS,
// });

// api.interceptors.request.use(async (config) => {
//   if (!BASE) {
//     throw new ErrorApi('SIN_CONFIGURAR', 'Falta EXPO_PUBLIC_API_URL en el .env', 0);
//   }
//   const token = await obtenerToken();
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// api.interceptors.response.use(
//   (respuesta) => respuesta,
//   (error) => {
//     if (error instanceof ErrorApi) throw error;

//     if (axios.isAxiosError(error) && error.response) {
//       const { status, data, config } = error.response;
//       if (status === 401 && config.headers?.Authorization) alExpirarSesion?.();
//       throw new ErrorApi(
//         data?.error?.codigo ?? 'ERROR_INTERNO',
//         data?.error?.mensaje ?? 'Algo salió mal.',
//         status
//       );
//     }

//     throw new ErrorApi('SIN_CONEXION', 'No hay conexión. Probá de nuevo.', 0);
//   }
// );

// type Opciones = { metodo?: string; cuerpo?: unknown; formData?: FormData; timeoutMs?: number };

// export async function pedir<T>(
//   ruta: string,
//   opciones: Opciones = {}
// ): Promise<{ datos: T; meta: any }> {
//   const respuesta = await api.request<{ datos: T; meta: any }>({
//     url: ruta,
//     method: opciones.metodo ?? 'GET',
//     data: opciones.formData ?? opciones.cuerpo,
//     timeout: opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS,
//   });
//   return respuesta.data;
// }

export * from './api';