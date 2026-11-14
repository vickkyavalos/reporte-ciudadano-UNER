import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onSesionExpirada } from "../servicios/clienteService";
import * as auth from '../servicios/authService';
import { darDeBajaDispositivo, registrarDispositivo } from '../servicios/notificaciones';
import type { Usuario } from '../tipos/usuario.interface';

type Ctx = {
  usuario: Usuario | null;
  cargando: boolean;
  esOperador: boolean;
  ingresar: (email: string, contrasena: string) => Promise<void>;
  ingresarConHuella: () => Promise<boolean>;
  salir: () => Promise<void>;
};

const AuthContext = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    auth
      .restaurarSesion()
      .then(setUsuario)
      .finally(() => setCargando(false));

    onSesionExpirada(() => {
      auth.cerrarSesion();
      setUsuario(null);
    });
  }, []);

  // Con sesión se registra el teléfono para recibir push, sólo si el permiso ya estaba dado:
  // el permiso se pide cuando el vecino activa los avisos (regla de la Unidad 4).
  const usuarioId = usuario?.id;
  useEffect(() => {
    if (usuarioId) void registrarDispositivo();
  }, [usuarioId]);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        esOperador: usuario?.rol === 'operador',
        ingresar: async (email, contrasena) => {
          setUsuario(await auth.iniciarSesion(email, contrasena));
        },
        ingresarConHuella: async () => {
          const u = await auth.ingresarConHuellaGuardada();
          if (!u) return false;
          setUsuario(u);
          return true;
        },
        salir: async () => {
          // Primero la baja del teléfono: después de cerrar sesión ya no hay token para pedirla.
          await darDeBajaDispositivo();
          await auth.cerrarSesion();
          setUsuario(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
