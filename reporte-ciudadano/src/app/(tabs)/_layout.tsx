import { Tabs, Redirect } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
<<<<<<< HEAD


=======
>>>>>>> 1f4af659bdda021878d4f85c69ade9f06ded0622
import { useAuth } from '@/providers/AuthProvider';

export default function TabsLayout() {
  const { usuario } = useAuth();

  if (!usuario) return <Redirect href="/login" />;

  if (usuario.rol === 'operador') return <Redirect href="/operador/detalle_operador" />;

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

      <Tabs.Screen
        name="operador"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}