import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EstadoBadge } from "../ui/text-estado";
import { COLORES } from "@/constants/estados";
import type { Reporte, TipoDeReporte } from "@/tipos/reporte.interface";

type NombreIcono = ComponentProps<typeof Ionicons>["name"];

//que hay que pasar
interface Props {
  reporte: Reporte;
  tipo: TipoDeReporte | undefined;
  seleccionado: boolean;
  yaSumado: boolean;
  sumando: boolean;
  onPress: () => void;
  onSumarme: () => void;
}

export function ReporteItem({ reporte, tipo, seleccionado, yaSumado, sumando, onPress, onSumarme }: Props) {
  const titulo = `${tipo?.nombre ?? "Reporte"} en ${reporte.direccion}`;
  return (
    <View style={[styles.fila, seleccionado && styles.filaSeleccionada]}>
      <Pressable
        onPress={onPress}
        style={styles.zonaPrincipal}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. Ver en el mapa`}
      >
        <View style={styles.icono}>
          <Ionicons name={(tipo?.icono ?? "alert-circle-outline") as NombreIcono} size={22} color={COLORES.texto} />
        </View>

        <View style={styles.centro}>
          <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
          <View style={styles.meta}>
            <EstadoBadge estado={reporte.estado} />
            {reporte.adhesiones > 0 && (
              <Text style={styles.vecinos}>
                {reporte.adhesiones} {reporte.adhesiones === 1 ? "vecino" : "vecinos"}
              </Text>
            )}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onSumarme}
        disabled={yaSumado || sumando}
        style={[styles.boton, (yaSumado || sumando) && styles.botonInactivo]}
        accessibilityRole="button"
        accessibilityLabel={yaSumado ? "Ya te sumaste" : `Sumarme a ${titulo}`}
      >
        <Text style={styles.botonTexto}>{yaSumado ? "Sumado" : "Sumarme"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  zonaPrincipal: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORES.linea },
  filaSeleccionada: { backgroundColor: "#F9FAFB" },
  icono: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORES.fondo, alignItems: "center", justifyContent: "center" },
  centro: { flex: 1, gap: 6 },
  titulo: { fontSize: 17, fontWeight: "600", color: COLORES.texto },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  vecinos: { fontSize: 13, color: COLORES.textoSuave },
  boton: { minHeight: 48, minWidth: 104, paddingHorizontal: 14, borderRadius: 10, borderWidth: 2, borderColor: COLORES.primario, alignItems: "center", justifyContent: "center", backgroundColor: COLORES.superficie },
  botonInactivo: { opacity: 0.45 },
  botonTexto: { fontSize: 16, fontWeight: "700", color: COLORES.primario },
});
