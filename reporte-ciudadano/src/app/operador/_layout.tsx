// import { Redirect, Stack } from "expo-router";
// import { haySesion, obtenerRol } from "@/servicios/authService";

// export default function OperadorLayout() {
//   if (!haySesion()) {
//     return <Redirect href="/login" />;
//   }
//   if (obtenerRol() !== "operador") {
//     return <Redirect href="/" />;
//   }

//   return <Stack screenOptions={{ headerShown: false }} />;
// }
// import { Redirect, Stack } from 'expo-router';
// import { useAuth } from '@/providers/AuthProvider';

// export default function OperadorLayout() {
//   const { usuario } = useAuth();

//   if (usuario?.rol !== 'operador') {
//     return <Redirect href="/" />;
//   }

//   return <Stack screenOptions={{ headerShown: false }} />;
// }

//esto agregue yo vicky
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function OperadorLayout() {
  const { usuario } = useAuth();

  if (usuario?.rol !== 'operador') return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}