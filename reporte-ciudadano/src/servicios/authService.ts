// src/servicios/authService.ts
import type { Usuario } from '@/tipos/usuario.interface';
import { mock_usuario } from '@/mocks/usuario.mocks';

let usuarioActual: Usuario | null = null;

export async function iniciarSesion(identificador: string, contrasena: string): Promise<Usuario> {
  await new Promise((r) => setTimeout(r, 300)); // simula red
  const usuario = mock_usuario.find(
    (u) => u.email === identificador.trim().toLowerCase()
  );
  if (!usuario) {
    throw { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Los datos ingresados no son correctos.' };
  }
  usuarioActual = usuario;
  return usuario;
}

export async function cerrarSesion(): Promise<void> {
  usuarioActual = null;
}

export function haySesion(): boolean {
  return usuarioActual !== null;
}

export function obtenerUsuario(): Usuario | null {
  return usuarioActual;
}

export function obtenerRol() {
  return usuarioActual?.rol ?? null;
}