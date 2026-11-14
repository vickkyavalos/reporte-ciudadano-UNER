import { createContext, useContext, useState, ReactNode } from "react";
import type { Usuario } from "@/tipos/usuario.interface";

type Sesion = {
  usuario: Usuario | null;
  iniciar: (u: Usuario) => void;
  cerrar: () => void;
};

const SesionContext = createContext<Sesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  return (
    <SesionContext.Provider
      value={{ usuario, iniciar: setUsuario, cerrar: () => setUsuario(null) }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("Falta SesionProvider");
  return {
    ...ctx,
    esOperador: ctx.usuario?.rol === "operador",
    esVecino: ctx.usuario?.rol === "vecino",
  };
}