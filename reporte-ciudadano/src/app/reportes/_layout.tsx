// import { Stack } from 'expo-router';

// export default function Layout() {
//   return <Stack screenOptions={{ headerShown: false }} />;
// }

import { Stack } from 'expo-router';

export default function ReportesLayout() {
  return (
    <Stack>
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo reporte', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalle del reclamo' }} />
    </Stack>
  );
}