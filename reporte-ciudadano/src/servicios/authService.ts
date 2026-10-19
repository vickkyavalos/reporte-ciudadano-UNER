let sesionActiva = false;

export async function iniciarSesion(identificador: string, contrasena: string): Promise<void> {
  sesionActiva = true;
}

export async function cerrarSesion(): Promise<void> {
  sesionActiva = false;
}

export function haySesion(): boolean {
  return sesionActiva;
}