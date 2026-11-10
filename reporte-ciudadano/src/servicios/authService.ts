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

export async function actualizarPreferenciaAvisos(avisosActivos: boolean): Promise<Usuario> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (!usuarioActual) {
    throw new Error("Iniciá sesión para cambiar la preferencia de avisos.");
  }

  const usuarioMock = mock_usuario.find((usuario) => usuario.id === usuarioActual?.id);
  if (!usuarioMock) {
    throw new Error("No se encontró el usuario actual.");
  }
  usuarioMock.avisosActivos = avisosActivos;
  usuarioActual = { ...usuarioActual, avisosActivos };
  return { ...usuarioActual };
}