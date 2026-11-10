import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { haySesion, obtenerRol } from "@/servicios/authService";

export default function TabsLayout() {
  if (!haySesion()) {
    return <Redirect href="/login" />;
  }
  if (obtenerRol() === "operador") {
    return <Redirect href="/operador/operador" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mis-reportes"
        options={{
          title: "Mis Reportes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}