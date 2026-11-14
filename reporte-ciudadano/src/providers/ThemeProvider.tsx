import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  Colors,
  EstadosColors,
  Accessibility,
  Fonts,
  Spacing,
  BottomTabInset,
  MaxContentWidth,
} from '@/constants/theme';

type Tema = 'claro' | 'oscuro';
type ColoresTema = typeof Colors.light | typeof Colors.dark;

type TemaContextoType = {
  tema: Tema;
  colores: ColoresTema;
  estadosColors: typeof EstadosColors;
  accesibilidad: typeof Accessibility;
  fuentes: typeof Fonts;
  espaciado: typeof Spacing;
  bottomTabInset: number;
  maxContentWidth: number;
  alternarTema: () => void;
};


const TemaContext = createContext<TemaContextoType | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const temaSistema = useColorScheme();
  const [tema, setTema] = useState<Tema>(temaSistema === 'dark' ? 'oscuro' : 'claro');

  const alternarTema = () => {
    setTema((t) => (t === 'claro' ? 'oscuro' : 'claro'));
  };

  const valor: TemaContextoType = {
    tema,
    colores: tema === 'oscuro' ? Colors.dark : Colors.light,
    estadosColors: EstadosColors,
    accesibilidad: Accessibility,
    fuentes: Fonts,
    espaciado: Spacing,
    bottomTabInset: BottomTabInset,
    maxContentWidth: MaxContentWidth,
    alternarTema,
  };

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export const useTema = () => {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error('useTema() tiene que usarse dentro de <TemaProvider>');
  }
  return ctx;
};