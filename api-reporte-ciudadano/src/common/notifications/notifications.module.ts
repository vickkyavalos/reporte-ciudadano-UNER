import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTORNO } from '../../config/environment.module.js';
import type { Entorno } from '../../config/environment.js';
import { DispositivoPush } from '../../student-notifications/device.entity.js';
import { EnviadorExpo } from '../../student-notifications/sender.js';
import { AlmacenTokensBase } from '../../student-notifications/token-store.js';
import { Usuario } from '../../modules/users/user.entity.js';
import { Avisos } from './notices.service.js';
import { EnviadorRegistro } from './registry-sender.js';
import {
  ALMACEN_TOKENS_PUSH,
  ENVIADOR_PUSH,
  type EnviadorPush,
} from './ports.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Usuario, DispositivoPush])],
  providers: [
    { provide: ALMACEN_TOKENS_PUSH, useClass: AlmacenTokensBase },
    {
      provide: ENVIADOR_PUSH,
      inject: [ENTORNO],
      useFactory: (entorno: Entorno): EnviadorPush =>
        entorno.NOTIFICACIONES === 'expo'
          ? new EnviadorExpo(entorno.EXPO_PUSH_URL)
          : new EnviadorRegistro(),
    },
    Avisos,
  ],
  exports: [Avisos, ALMACEN_TOKENS_PUSH],
})
export class NotificacionesModulo implements OnApplicationShutdown {
  constructor(private readonly avisos: Avisos) {}

  async onApplicationShutdown(): Promise<void> {
    await this.avisos.esperarEnvios();
  }
}
