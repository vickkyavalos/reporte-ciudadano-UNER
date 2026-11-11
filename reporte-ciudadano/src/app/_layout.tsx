import { Stack } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { TemaProvider } from '@/providers/ThemeProvider';
import { useSincronizacionCola } from '@/hooks/use-sincronizacion-cola';

function Rutas() {
  const { usuario, cargando } = useAuth();
  useSincronizacionCola(!!usuario);

  if (cargando) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
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