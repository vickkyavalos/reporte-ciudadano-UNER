import { Stack } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { TemaProvider } from '@/providers/ThemeProvider';
import { useSincronizacionCola } from '@/hooks/use-sincronizacion-cola';
import { useAbrirNotificacion } from '@/hooks/use-abrir-notificacion';

function Rutas() {
  const { usuario, cargando } = useAuth();
  useSincronizacionCola(!!usuario);
  useAbrirNotificacion(!cargando && !!usuario);

  if (cargando) return null;

  const esVecino = usuario?.rol === 'vecino';
  const esOperador = usuario?.rol === 'operador';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={esVecino}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={esOperador}>
        <Stack.Screen name="operador" />
      </Stack.Protected>

      <Stack.Protected guard={!!usuario}>
        <Stack.Screen name="reportes" />
      </Stack.Protected>

      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Rutas />
      </AuthProvider>
    </TemaProvider>
  );
}