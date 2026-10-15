import { Coordenadas } from "./reporte.interface";

export interface Zona {
 id: string;
 nombre: string;
 limite: Coordenadas[];
 referente: string;
}