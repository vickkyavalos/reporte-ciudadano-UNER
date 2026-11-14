import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { cargarNotificaciones } from '@/servicios/notificaciones';

type RespuestaNotificacion = {
  notification: { request: { identifier: string; content: { data?: Record<string, unknown> } } };
};

/**
 * Al tocar una notificación (con la app abierta o cerrada) abre el reporte del que habla.
 * La API manda el id en `data.reporteId`. En Expo Go no hace nada: ahí no hay push.
 */
export function useAbrirNotificacion(listo: boolean) {
  const atendida = useRef<string | null>(null);

  useEffect(() => {
    const Notifications = cargarNotificaciones();
    if (!listo || !Notifications) return;

    const abrir = (respuesta: RespuestaNotificacion | null) => {
      if (!respuesta) return;
      const id = respuesta.notification.request.identifier;
      if (atendida.current === id) return;
      atendida.current = id;

      const reporteId = respuesta.notification.request.content.data?.reporteId;
      if (typeof reporteId === 'string') {
        router.push({ pathname: '/reportes/[id]', params: { id: reporteId } });
      }
    };

    // Si la app estaba cerrada, la notificación tocada es la "última respuesta".
    abrir(Notifications.getLastNotificationResponse());
    const suscripcion = Notifications.addNotificationResponseReceivedListener(abrir);
    return () => suscripcion.remove();
  }, [listo]);
}
