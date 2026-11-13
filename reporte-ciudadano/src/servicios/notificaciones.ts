import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// notificaciones cuando la app está abierta en primer plano
    Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    } as any),
    });
    /**
     * Solicita permisos al usuario y obtiene el token de Expo para las notificaciones push.
     */
    export async function registrarParaNotificacionesPushAsync(): Promise<string | null> {
    let token: string | null = null;

    // Las push notifications físicas 
    if (!Device.isDevice) {
        console.warn('Las notificaciones push físicas no funcionan completamente en emuladores.');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // solicita permisos 
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('El usuario denegó los permisos para las notificaciones.');
        return null;
    }

    try {
        // Obtener el token de Expo push
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
    } catch (error) {
        console.error('Error al obtener el push token:', error);
    }

    // Configuración obligatoria para Android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
        name: 'Estado de Reclamos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        });
    }

    return token;
    }



    // notificación local en el dispositivo
    export async function programarNotificacionLocal(
    titulo: string, 
    cuerpo: string, 
    datosExtra?: Record<string, any>
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