import { Stack } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { TemaProvider } from '@/providers/ThemeProvider';

function Rutas() {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;

  return (
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