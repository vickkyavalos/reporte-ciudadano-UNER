import { Entity, Index } from 'typeorm';
import type { Plataforma } from '../../contract/api.js';
import { ColumnaClave, ColumnaEnum, ColumnaRef } from '../common/db/columns.js';

/**
 * Un teléfono que recibe push. El token es la clave primaria: así un token es de un solo
 * usuario a la vez, y dos pedidos simultáneos con el mismo token no pueden dejar dos filas.
 */
@Entity('dispositivos')
@Index(['usuarioId'])
export class DispositivoPush {
  @ColumnaClave(200)
  tokenExpo: string;

  @ColumnaRef()
  usuarioId: string;

  @ColumnaEnum()
  plataforma: Plataforma;
}
