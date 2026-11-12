import { Stack } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { TemaProvider } from '@/providers/ThemeProvider';
import { useSincronizacionCola } from '@/hooks/use-sincronizacion-cola';

function Rutas() {
  const { usuario, cargando } = useAuth();
  useSincronizacionCola(!!usuario);

  if (cargando) return null;

  const esVecino = usuario?.rol === 'vecino';
  const esOperador = usuario?.rol === 'operador';

  return (
<<<<<<< HEAD
   <Stack screenOptions={{ headerShown: false }}>
  <Stack.Protected guard={!!usuario}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="operador" />
    <Stack.Screen name="reportes" />
  </Stack.Protected>
=======
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
>>>>>>> 1f4af659bdda021878d4f85c69ade9f06ded0622

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