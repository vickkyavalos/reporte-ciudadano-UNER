import { REPORTES_MOCK } from "@/mocks/reportes.mock";
import { TIPOS_MOCK } from "@/mocks/tipos-reportes.mock";
import type { Coordenadas, Reporte } from "@/tipos/reporte.interface";
import type { RespuestaLista } from "@/tipos/api-interface";
import type { TipoDeReporte } from "@/tipos/reporte.interface";
import { distanciaMetros } from "@/utils/formato";
import type { PayloadCrearReporte } from "@/tipos/reporte.interface";

export const MOCK_CONFIG = { simularErrorDeRed: false, demoraMs: 400 };

export class ErrorServicio extends Error {
  constructor(public codigo: string, mensaje: string) {
    super(mensaje);
  }
}

const esperar = () => new Promise((r) => setTimeout(r, MOCK_CONFIG.demoraMs));

async function simular() {
  await esperar();
  if (MOCK_CONFIG.simularErrorDeRed) {
    throw new ErrorServicio("SIN_CONEXION", "No pudimos conectarnos. Revisá tu señal e intentá de nuevo.");
  }
}


let reportes: Reporte[] = [...REPORTES_MOCK];

export async function obtenerTipos(): Promise<TipoDeReporte[]> {
  await simular();
  return TIPOS_MOCK;
}

export async function obtenerReportesCercanos(
  centro: Coordenadas
): Promise<RespuestaLista<Reporte>> {
  await simular();
  const datos = [...reportes].sort(
    (a, b) => distanciaMetros(centro, a.coordenadas) - distanciaMetros(centro, b.coordenadas)
  );
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: 20 } };
}

export async function sumarseAReporte(reporteId: string): Promise<Reporte> {
  await simular();
  const actual = reportes.find((r) => r.id === reporteId);
  if (!actual) throw new ErrorServicio("REPORTE_NO_ENCONTRADO", "Ese reporte ya no existe.");
  const actualizado = { ...actual, adhesiones: actual.adhesiones + 1 };
  reportes = reportes.map((r) => (r.id === reporteId ? actualizado : r));
  return actualizado;
}

export async function crearReporte(payload: PayloadCrearReporte): Promise<Reporte> {
  await simular(); 

  const nuevoReporte: Reporte = {
    id: Math.random().toString(36).substring(7),
    codigo: `REP-${Math.floor(Math.random() * 10000)}`,
    tipoId: payload.tipoId,
    descripcion: payload.descripcion || null,
    audioUrl: payload.audioUrl || null,
    coordenadas: payload.coordenadas,
    direccion: payload.direccion,
    fotos: [
      { id: `foto_${Date.now()}`, url: payload.fotoLocalUri, momento: 'problema' }
    ],
    zonaId: 'z_pendiente', 
    estado: 'recibido',
    autorId: 'usr_actual', 
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: new Date().toISOString(),
    sincronizado: false, // Queda en false para programar la subida en segundo plano
  };
  
  
  reportes = [nuevoReporte, ...reportes];
  
  return nuevoReporte;
}