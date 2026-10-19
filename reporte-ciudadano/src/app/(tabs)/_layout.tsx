import { Redirect, Tabs } from 'expo-router';
import { haySesion } from '@/servicios/authService';

export default function TabsLayout() {
  if (!haySesion()) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerShown: false }} />
    </Tabs>
  );
}