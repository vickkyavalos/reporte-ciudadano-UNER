import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';


export default function TabsLayout() {

  const { usuario } = useAuth();
    if (usuario?.rol === 'operador') return <Redirect href="/operador/operador" />;
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mis-reportes"
        options={{
          title: 'Mis reportes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />
<<<<<<< HEAD

      <Tabs.Screen
        name="operador"
        options={{
          href: null, 
        }}
      />
=======
>>>>>>> 69d3e449f3539ea5f05f63a8ca8375b357452470
    </Tabs>
  );
}