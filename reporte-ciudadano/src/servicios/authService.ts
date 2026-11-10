// // src/servicios/authService.ts
// import type { Usuario } from '@/tipos/usuario.interface';
// import { mock_usuario } from '@/mocks/usuario.mocks';

// let usuarioActual: Usuario | null = null;

// export async function iniciarSesion(identificador: string, contrasena: string): Promise<Usuario> {
//   await new Promise((r) => setTimeout(r, 300)); // simula red
//   const usuario = mock_usuario.find(
//     (u) => u.email === identificador.trim().toLowerCase()
//   );
//   if (!usuario) {
//     throw { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Los datos ingresados no son correctos.' };
//   }
//   usuarioActual = usuario;
//   return usuario;
// }

// export async function cerrarSesion(): Promise<void> {
//   usuarioActual = null;
// }

// export function haySesion(): boolean {
//   return usuarioActual !== null;
// }

// export function obtenerUsuario(): Usuario | null {
//   return usuarioActual;
// }

// export function obtenerRol() {
//   return usuarioActual?.rol ?? null;
// }

// src/servicios/authService.ts
// src/servicios/authService.ts
import type { Usuario } from '@/tipos/usuario.interface';
import { pedir, guardarToken, obtenerToken, borrarToken, onSesionExpirada } from "./clienteService";

let usuarioActual: Usuario | null = null;

onSesionExpirada(() => {
  usuarioActual = null;
});

export async function iniciarSesion(identificador: string, contrasena: string): Promise<Usuario> {
  const { datos } = await pedir<{ token: string; usuario: Usuario }>('/auth/ingreso', {
    metodo: 'POST',
    cuerpo: { email: identificador.trim().toLowerCase(), contrasena },
  });
  await guardarToken(datos.token);
  usuarioActual = datos.usuario;
  return datos.usuario;
}

export async function restaurarSesion(): Promise<Usuario | null> {
  const token = await obtenerToken();
  if (!token) return null;
  try {
    const { datos } = await pedir<Usuario>('/yo');
    usuarioActual = datos;
    return datos;
  } catch {
    await borrarToken();
    usuarioActual = null;
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  await borrarToken();
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