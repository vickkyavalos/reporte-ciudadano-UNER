import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';

const CLAVE_TOKEN_PUSH = 'token_push';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


export async function registrarDispositivo(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  try {
  
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

export async function darDeBajaDispositivo(): Promise<void> {
  if (Platform.OS === 'web') return;
  const tokenExpo = await SecureStore.getItemAsync(CLAVE_TOKEN_PUSH);
  if (!tokenExpo) return;
  try {
    await api.delete(`/dispositivos/${encodeURIComponent(tokenExpo)}`);
  } catch {
   
  }
  await SecureStore.deleteItemAsync(CLAVE_TOKEN_PUSH);
}

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
    trigger: null, 
  });
}
