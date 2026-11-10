import { Redirect, Stack } from "expo-router";
import { haySesion, obtenerRol } from "@/servicios/authService";

export default function OperadorLayout() {
  if (!haySesion()) {
    return <Redirect href="/login" />;
  }
  if (obtenerRol() !== "operador") {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
