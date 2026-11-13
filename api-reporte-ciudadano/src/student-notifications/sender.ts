import { Injectable, Logger } from '@nestjs/common';
import type {
  EnviadorPush,
  MensajePush,
} from '../common/notifications/ports.js';

/** Expo acepta hasta 100 mensajes por pedido. */
const TANDA = 100;

interface MensajeExpo {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

interface TicketExpo {
  status: 'ok' | 'error';
  details?: { error?: string };
}

/** Manda las push al servicio de Expo (`url` = EXPO_PUSH_URL; en los tests, un Expo falso). */
@Injectable()
export class EnviadorExpo implements EnviadorPush {
  private readonly logger = new Logger('EnviadorExpo');

  constructor(readonly url: string) {}

  async enviar(
    mensajes: MensajePush[],
  ): Promise<{ tokensInvalidos: string[] }> {
    // Un mensaje de Expo por cada token.
    const salida: MensajeExpo[] = mensajes.flatMap((mensaje) =>
      mensaje.tokens.map((to) => ({
        to,
        title: mensaje.titulo,
        body: mensaje.cuerpo,
        data: mensaje.datos,
      })),
    );

    const tokensInvalidos: string[] = [];
    for (let inicio = 0; inicio < salida.length; inicio += TANDA) {
      const tanda = salida.slice(inicio, inicio + TANDA);
      try {
        const respuesta = await fetch(this.url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tanda),
        });
        if (!respuesta.ok) {
          this.logger.warn(
            `Expo respondió ${respuesta.status}; se sigue con la próxima tanda`,
          );
          continue;
        }
        // Expo devuelve un ticket por mensaje, en el mismo orden en que se mandaron.
        const { data } = (await respuesta.json()) as { data?: TicketExpo[] };
        (data ?? []).forEach((ticket, posicion) => {
          const mensaje = tanda[posicion];
          if (
            mensaje &&
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          )
            tokensInvalidos.push(mensaje.to);
        });
      } catch (error) {
        // Una push que falla nunca rompe lo que el usuario estaba haciendo.
        this.logger.warn(
          `No se pudo mandar a Expo: ${(error as Error).message}`,
        );
      }
    }
    return { tokensInvalidos };
  }
}
