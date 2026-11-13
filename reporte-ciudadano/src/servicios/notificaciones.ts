import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Alert, Linking, Platform } from 'react-native';
import { api } from './api';

type ModuloNotificaciones = typeof import('expo-notifications');

// Token de Expo de este teléfono, para poder darlo de baja al cerrar sesión.
const CLAVE_TOKEN_PUSH = 'token_push';

/**
 * Desde SDK 53, Expo Go no trae las push: en Android, el solo hecho de importar
 * expo-notifications tira un error y se cae la app. Por eso el módulo se carga recién cuando
 * se lo necesita y sólo en un development build o en la app instalada. En Expo Go la app anda
 * igual, sin push.
 */
export const pushDisponible =
  Platform.OS !== 'web' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let modulo: ModuloNotificaciones | null = null;

export function cargarNotificaciones(): ModuloNotificaciones | null {
  if (!pushDisponible) return null;
  if (!modulo) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('expo-notifications') as ModuloNotificaciones;
    // Cómo se muestran las notificaciones que llegan con la app abierta.
    modulo.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return modulo;
}

/**
 * - activados: hay permiso y el teléfono quedó registrado.
 * - pendiente: todavía no se pidió el permiso (o se puede volver a pedir).
 * - bloqueado: el usuario lo negó y ya sólo se habilita desde la configuración del teléfono.
 * - no-disponible: Expo Go, web, emulador o falta configurar EAS: no hay push.
 */
export type EstadoAvisosPush = 'activados' | 'pendiente' | 'bloqueado' | 'no-disponible';

type Permiso = { status: string; canAskAgain: boolean };
const segunPermiso = (permiso: Permiso): EstadoAvisosPush =>
  permiso.status === 'granted' ? 'activados' : permiso.canAskAgain ? 'pendiente' : 'bloqueado';

/** Sin pedir nada: si el teléfono puede recibir push y qué pasa con el permiso. */
export async function estadoAvisosPush(): Promise<EstadoAvisosPush> {
  const Notifications = cargarNotificaciones();
  if (!Notifications || !Device.isDevice) return 'no-disponible';
  return segunPermiso(await Notifications.getPermissionsAsync());
}

/**
 * Registra el teléfono en la API (POST /dispositivos) para que lleguen los avisos de cambio de
 * estado y de adhesiones. Como pide el apunte de la unidad, el permiso se pide recién cuando el
 * vecino activa algo que lo necesita (`pedirPermiso`); al iniciar sesión sólo se registra si el
 * permiso ya estaba dado. Si algo falla no rompe nada: la app sigue andando, sin push.
 */
export async function registrarDispositivo(pedirPermiso = false): Promise<EstadoAvisosPush> {
  const Notifications = cargarNotificaciones();
  // Las push sólo llegan a un teléfono real.
  if (!Notifications || !Device.isDevice) return 'no-disponible';

  try {
    let permiso = await Notifications.getPermissionsAsync();
    if (permiso.status !== 'granted' && !pedirPermiso) return segunPermiso(permiso);

    // En Android 13 o más, sin un canal creado ni siquiera aparece el pedido de permiso.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Estado de reclamos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (permiso.status !== 'granted') {
      permiso = await Notifications.requestPermissionsAsync();
      if (permiso.status !== 'granted') return segunPermiso(permiso);
    }

    // El token de Expo necesita el id del proyecto de EAS (npx eas-cli init lo agrega a app.json).
    const projectId =
      Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('[push] Falta el projectId de EAS: corré "npx eas-cli init".');
      return 'no-disponible';
    }

    const { data: tokenExpo } = await Notifications.getExpoPushTokenAsync({ projectId });
    // Para diagnosticar: con este token se puede probar en expo.dev/notifications.
    console.log('[push] token:', tokenExpo);
    await api.post('/dispositivos', {
      tokenExpo,
      plataforma: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    await SecureStore.setItemAsync(CLAVE_TOKEN_PUSH, tokenExpo);
    return 'activados';
  } catch (error) {
    console.warn('[push] No se pudo registrar el teléfono', error);
    return 'no-disponible';
  }
}

/** Si los avisos no se pudieron activar, se lo explica al vecino. */
export function explicarAvisos(estado: EstadoAvisosPush): void {
  if (estado === 'bloqueado') {
    Alert.alert(
      'Los avisos están apagados en el teléfono',
      'Para que te avisemos cuando cambie tu reclamo, habilitá las notificaciones de la app en la configuración.',
      [
        { text: 'Ahora no', style: 'cancel' },
        { text: 'Abrir configuración', onPress: () => void Linking.openSettings() },
      ],
    );
  } else if (estado === 'no-disponible') {
    Alert.alert(
      'Avisos no disponibles',
      'Esta versión de la app no puede recibir avisos en el teléfono. Igual vas a ver los cambios en Mis reportes.',
    );
  }
}

/** Da de baja el teléfono (DELETE /dispositivos/:token). Se llama antes de cerrar sesión. */
export async function darDeBajaDispositivo(): Promise<void> {
  if (!pushDisponible) return;
  const tokenExpo = await SecureStore.getItemAsync(CLAVE_TOKEN_PUSH);
  if (!tokenExpo) return;
  try {
    await api.delete(`/dispositivos/${encodeURIComponent(tokenExpo)}`);
  } catch {
    // Si no hay señal no pasa nada: si otro usuario entra en este teléfono, el token pasa a él.
  }
  await SecureStore.deleteItemAsync(CLAVE_TOKEN_PUSH);
}

// notificación local en el dispositivo
export async function programarNotificacionLocal(
  titulo: string,
  cuerpo: string,
  datosExtra?: Record<string, unknown>,
) {
  const Notifications = cargarNotificaciones();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      data: datosExtra || {},
    },
    trigger: null, // Se ejecuta inmediatamente
  });
}
