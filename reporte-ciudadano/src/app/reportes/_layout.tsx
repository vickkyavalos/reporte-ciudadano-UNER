import { Stack, useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";

export default function ReportesLayout() {
  const router = useRouter();
  const navigation = useNavigation();

  return (
    <Stack>
      <Stack.Screen name="nuevo" options={{ title: "Nuevo reporte" }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Detalle del reclamo",
          headerBackVisible: false,
          headerLeft: () => (
            <Ionicons
              name="arrow-back"
              size={24}
              color="#222222"
              onPress={() => {
                if (navigation.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/mis-reportes");
                }
              }}
            />
          ),
        }}
      />
    </Stack>
  );
}