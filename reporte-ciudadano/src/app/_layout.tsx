import { Stack } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { TemaProvider } from '@/providers/ThemeProvider';
import { useSincronizacionCola } from '@/hooks/use-sincronizacion-cola';

function Rutas() {
  const { usuario, cargando } = useAuth();
  useSincronizacionCola(!!usuario);

  if (cargando) return null;

  return (
<<<<<<< HEAD
   <Stack screenOptions={{ headerShown: false }}>
  <Stack.Protected guard={!!usuario}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="operador" />
    <Stack.Screen name="reportes" />
  </Stack.Protected>

  <Stack.Protected guard={!usuario}>
    <Stack.Screen name="login" />
  </Stack.Protected>
</Stack>
=======
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!usuario}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="operador" />
        <Stack.Screen name="reportes" />
      </Stack.Protected>

      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
>>>>>>> 69d3e449f3539ea5f05f63a8ca8375b357452470
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
