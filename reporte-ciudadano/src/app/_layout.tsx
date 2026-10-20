import { Stack } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { TemaProvider } from '@/providers/ThemeProvider';

export default function RootLayout() {
  return (
    <TemaProvider>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </TemaProvider>
  );
}