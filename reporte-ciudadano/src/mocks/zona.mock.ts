import { Zona } from "@/tipos/zona.interface";

const NO = { latitud: -32.975, longitud: -58.565 };
const NE = { latitud: -32.975, longitud: -58.475 };
const SE = { latitud: -33.055, longitud: -58.475 };
const SO = { latitud: -33.055, longitud: -58.565 };
const CENTRO = { latitud: -33.02, longitud: -58.52 };

export const mock_zonas: Zona[] = [
  { id: "zon-norte", nombre: "Zona Norte", referente: "Marcela Ibarra", limite: [NO, NE, CENTRO] },
  { id: "zon-este", nombre: "Zona Este", referente: "Rubén Godoy", limite: [NE, SE, CENTRO] },
  { id: "zon-sur", nombre: "Zona Sur", referente: "Diego Montenegro", limite: [SE, SO, CENTRO] },
  { id: "zon-oeste", nombre: "Zona Oeste", referente: "Analía Fernández", limite: [SO, NO, CENTRO] },
];
