// import { Stack, Redirect } from 'expo-router';
// import { useAuth } from '@/providers/AuthProvider';

// export default function OperadorLayout() {
//   const { usuario } = useAuth();

//   if (usuario?.rol !== 'operador') return <Redirect href="/" />;

//   return <Stack screenOptions={{ headerShown: false }} />;
// }

import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function OperadorLayout() {
  const { usuario } = useAuth();

  if (usuario?.rol !== 'operador') return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}