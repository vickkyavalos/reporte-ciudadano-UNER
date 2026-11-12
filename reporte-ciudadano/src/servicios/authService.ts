import * as SecureStore from 'expo-secure-store';
import { api, CLAVE_TOKEN, ErrorApi } from './api';
import type { Usuario } from '../tipos/usuario.interface';

const CLAVE_USUARIO = 'usuario';

let usuarioActual: Usuario | null = null;

async function recordarUsuario(usuario: Usuario): Promise<Usuario> {
	usuarioActual = usuario;
	await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario));
	return usuario;
}

async function leerUsuarioGuardado(): Promise<Usuario | null> {
	const guardado = await SecureStore.getItemAsync(CLAVE_USUARIO);
	if (!guardado) return null;
	try {
		return JSON.parse(guardado) as Usuario;
	} catch {
		return null;
	}
}

export function obtenerUsuario(): Usuario | null {
	return usuarioActual;
}

export async function iniciarSesion(identifier: string, password: string): Promise<Usuario> {
	const email = identifier.trim().toLowerCase();
	if (!email.includes('@')) {
		throw new ErrorApi('VALIDACION_FALLIDA', 'Ingrese su correo electrónico.');
	}
	const res = await api.post('/auth/ingreso', { email, contrasena: password });
	const { token, usuario } = res.data.datos as { token: string; usuario: Usuario };
	await SecureStore.setItemAsync(CLAVE_TOKEN, token);
	return recordarUsuario(usuario);
}

export async function cerrarSesion() {
	await SecureStore.deleteItemAsync(CLAVE_TOKEN);
	await SecureStore.deleteItemAsync(CLAVE_USUARIO);
	usuarioActual = null;
}

export async function obtenerSesion(): Promise<Usuario | null> {
	const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
	if (!token) return null;
	try {
		const res = await api.get('/yo');
		return await recordarUsuario(res.data.datos as Usuario);
	} catch (error) {
		if (error instanceof ErrorApi && error.status === 401) {
			await cerrarSesion();
			return null;
		}
		// Sin conexión o con la API caída, se sigue con el último usuario conocido.
		usuarioActual = await leerUsuarioGuardado();
		return usuarioActual;
	}
}

export async function actualizarPreferenciaAvisos(avisosActivos: boolean): Promise<Usuario> {
	const res = await api.patch('/yo', { avisosActivos });
	return recordarUsuario(res.data.datos as Usuario);
}

export function haySesion(): boolean {
	return usuarioActual !== null;
}

export function obtenerRol(): Usuario['rol'] | null {
	return usuarioActual?.rol ?? null;
}

export const obtenerYo = obtenerUsuario;
export const restaurarSesion = obtenerSesion;