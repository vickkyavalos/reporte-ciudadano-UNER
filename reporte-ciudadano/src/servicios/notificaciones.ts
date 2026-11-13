import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';

// Token de Expo de este teléfono, para poder darlo de baja al cerrar sesión.
const CLAVE_TOKEN_PUSH = 'token_push';

// Cómo se muestran las notificaciones que llegan con la app abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pide permiso, obtiene el token de Expo y lo registra en la API (POST /dispositivos) para que
 * lleguen los avisos de cambio de estado y de adhesiones. Si algo falla no rompe nada: la app
 * sigue andando, sólo que sin push.
 */
export async function registrarDispositivo(): Promise<string | null> {
  // Las push sólo llegan a un teléfono real.
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  try {
    // En Android 13 o más, sin un canal creado ni siquiera aparece el pedido de permiso.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Estado de reclamos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    // El token de Expo necesita el id del proyecto de EAS (npx eas-cli init lo agrega a app.json).
    const projectId =
      Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('[push] Falta el projectId de EAS: corré "npx eas-cli init".');
      return null;
    }

    const { data: tokenExpo } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/dispositivos', {
      tokenExpo,
      plataforma: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    await SecureStore.setItemAsync(CLAVE_TOKEN_PUSH, tokenExpo);
    return tokenExpo;
  } catch (error) {
    console.warn('[push] No se pudo registrar el teléfono', error);
    return null;
  }
}

/** Da de baja el teléfono (DELETE /dispositivos/:token). Se llama antes de cerrar sesión. */
export async function darDeBajaDispositivo(): Promise<void> {
  if (Platform.OS === 'web') return;
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
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      data: datosExtra || {},
    },
    trigger: null, // Se ejecuta inmediatamente
  });
}
