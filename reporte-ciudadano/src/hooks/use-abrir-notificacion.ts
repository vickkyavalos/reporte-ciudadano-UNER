import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Al tocar una notificación (con la app abierta o cerrada) abre el reporte del que habla.
 * La API manda el id en `data.reporteId`.
 */
export function useAbrirNotificacion(listo: boolean) {
  const respuesta = Notifications.useLastNotificationResponse();
  const atendida = useRef<string | null>(null);

  useEffect(() => {
    if (!listo || !respuesta) return;
    const id = respuesta.notification.request.identifier;
    if (atendida.current === id) return;
    atendida.current = id;

    const reporteId = respuesta.notification.request.content.data?.reporteId;
    if (typeof reporteId === 'string') {
      router.push({ pathname: '/reportes/[id]', params: { id: reporteId } });
    }
  }, [listo, respuesta]);
}
