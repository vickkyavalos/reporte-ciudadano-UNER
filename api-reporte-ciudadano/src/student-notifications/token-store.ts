import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type Repository } from 'typeorm';
import type { Plataforma } from '../../contract/api.js';
import type { AlmacenTokensPush } from '../common/notifications/ports.js';
import { DispositivoPush } from './device.entity.js';

/** Guarda los tokens de Expo de cada usuario en la tabla `dispositivos`. */
@Injectable()
export class AlmacenTokensBase implements AlmacenTokensPush {
  constructor(
    @InjectRepository(DispositivoPush)
    private readonly dispositivos: Repository<DispositivoPush>,
  ) {}

  /**
   * Un solo upsert por la clave primaria: si el token no estaba lo crea, y si estaba (de este
   * usuario o de otro) le actualiza el dueño y la plataforma. Al ser una sola operación en la
   * base, dos pedidos simultáneos con el mismo token no chocan.
   */
  async guardar(
    usuarioId: string,
    tokenExpo: string,
    plataforma: Plataforma,
  ): Promise<void> {
    await this.dispositivos.upsert({ tokenExpo, usuarioId, plataforma }, [
      'tokenExpo',
    ]);
  }

  async borrar(tokenExpo: string): Promise<void> {
    await this.dispositivos.delete({ tokenExpo });
  }

  async tokensDe(usuarioIds: string[]): Promise<string[]> {
    if (usuarioIds.length === 0) return [];
    const filas = await this.dispositivos.find({
      where: { usuarioId: In(usuarioIds) },
      select: { tokenExpo: true },
      order: { tokenExpo: 'ASC' },
    });
    return filas.map((fila) => fila.tokenExpo);
  }

  async descartar(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.dispositivos.delete({ tokenExpo: In(tokens) });
  }
}
