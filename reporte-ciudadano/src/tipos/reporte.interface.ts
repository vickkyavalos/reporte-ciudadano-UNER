import { StretchInX } from "react-native-reanimated";

export type EstadoReporte =  | "recibido" | "en_revision" | "asignado" | "resuelto" | "rechazado";

export interface Coordenadas{
    latitud:number;
    longitud: number;
}

export interface Foto {
 id: string;
 url: string; // o ruta local mientras no se subió
 momento:"problema" | "arreglo";
}

export interface Reporte{
    id:string;
    codigo: string;
    tipoId:string;
    descripcion:string|null;
    audioUrl:string|null;
    coordenadas: Coordenadas;
    fotos: Foto[]
    direccion:string;
    zonaId:string;
    estado:EstadoReporte;
    autorId:string;
    cuadrillaId:string|null;
    duplicadoDe:string|null;
    adhesiones:number;
    creadoEn:string;
    sincronizado:boolean;
    
}
 export interface TipoDeReporte{
    id:string;
    nombre:string;
    icono:string;
    color:string;
    areaResponsable:string;
 }

 export interface CambioDeEstado {
 id: string;
 reporteId: string;
 estado: EstadoReporte;
 comentario: string | null;
 operadorId: string | null;
 }