import type { CambioDeEstado } from "@/tipos/cambioDeEstado";

export type EstadoReporte =  | "recibido" | "en_revision" | "asignado" | "resuelto" | "rechazado";

export interface Coordenadas {
    latitud: number;
    longitud: number;
}

export interface Foto {
    id: string;
    url: string; 
    momento: "problema" | "arreglo";
}

export interface Reporte {
    id: string;
    codigo: string;
    tipoId: string;
    descripcion: string | null;
    audioUrl: string | null;
    coordenadas: Coordenadas;
    fotos: Foto[];
    direccion: string;
    zonaId: string;
    estado: EstadoReporte;
    autorId: string;
    cuadrillaId: string | null;
    duplicadoDe: string | null;
    adhesiones: number;
    creadoEn: string;
    sincronizado: boolean;
    historial: CambioDeEstado[];
    comentarioCierre: string | null;
}

export interface CambiosOperadorReporte {
    estado: EstadoReporte;
    cuadrillaId: string | null;
    comentario: string;
    fotoArreglo: string | null;
    duplicadoDe: string | null;
}

export interface TipoDeReporte {
    id: string;
    nombre: string;
    icono: string;
    color: string;
    areaResponsable: string;
}

export type PayloadCrearReporte = Pick<Reporte, 'tipoId' | 'descripcion' | 'audioUrl' | 'coordenadas' | 'direccion'> & {
    fotosUris: string[]; 
    direccionPendiente: boolean; 
};