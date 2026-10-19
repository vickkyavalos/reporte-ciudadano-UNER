//import { Redirect, Tabs } from 'expo-router';
//import { haySesion } from '@/servicios/authService';

//export default function TabsLayout() {
//  if (!haySesion()) {
//    return <Redirect href="/login" />;
//  }

 // return (
//    <Tabs>
//      <Tabs.Screen name="index" options={{ title: 'Inicio', headerShown: false }} />
//    </Tabs>
//  );
//}


import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { haySesion } from "@/servicios/authService";

export default function TabsLayout() {
  if (!haySesion()) {
    return <Redirect href="/login" />;
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

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
