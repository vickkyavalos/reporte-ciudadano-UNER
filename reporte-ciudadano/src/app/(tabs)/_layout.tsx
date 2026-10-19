import { Redirect, Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { haySesion } from '@/servicios/authService';

export default function TabsLayout() {
  if (!haySesion()) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#111827' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="operador"
        options={{
          title: 'Operador',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}