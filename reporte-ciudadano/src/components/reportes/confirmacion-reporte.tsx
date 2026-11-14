import Icon from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORES } from "@/constants/estados";
import { actualizarPreferenciaAvisos, obtenerUsuario } from "@/servicios/authService";
import { suscribirCola } from "@/servicios/colaReportes";
import {
  estadoAvisosPush,
  explicarAvisos,
  registrarDispositivo,
  type EstadoAvisosPush,
} from "@/servicios/notificaciones";
import { obtenerReportePorId } from "@/servicios/reportes";
import type { Reporte } from "@/tipos/reporte.interface";

interface Props {
  reporteInicial: Reporte;
  onVerMisReportes: () => void;
  onTerminar: () => void;
}

export function ConfirmacionReporte({ reporteInicial, onVerMisReportes, onTerminar }: Props) {
  const [reporte, setReporte] = useState(reporteInicial);
  const [avisos, setAvisos] = useState<EstadoAvisosPush | null>(null);
  const [activando, setActivando] = useState(false);

  // Recién acá el vecino tiene algo por lo que quiere que le avisen: es el momento de ofrecerlo.
  useEffect(() => {
    void estadoAvisosPush().then((estado) =>
      setAvisos(estado === "activados" && !obtenerUsuario()?.avisosActivos ? "pendiente" : estado),
    );
  }, []);

  const activarAvisos = async () => {
    setActivando(true);
    try {
      if (!obtenerUsuario()?.avisosActivos) await actualizarPreferenciaAvisos(true);
      const estado = await registrarDispositivo(true);
      setAvisos(estado);
      explicarAvisos(estado);
    } catch {
      explicarAvisos("no-disponible");
    } finally {
      setActivando(false);
    }
  };

  useEffect(
    () =>
      suscribirCola(() => {
        obtenerReportePorId(reporteInicial.id).then(setReporte).catch(() => undefined);
      }),
    [reporteInicial.id],
  );

  return (
    <View style={styles.contenedor}>
      <Icon
        name={reporte.sincronizado ? "checkmark-circle" : "cloud-offline-outline"}
        size={84}
        color={reporte.sincronizado ? "#15803D" : "#B45309"}
      />
      <Text style={styles.titulo} accessibilityRole="header">
        {reporte.sincronizado ? "¡Reporte enviado!" : "Reporte guardado"}
      </Text>

      <View style={styles.codigoCaja}>
        <Text style={styles.codigoEtiqueta}>
          {reporte.sincronizado ? "Tu número de seguimiento" : "Número provisorio"}
        </Text>
        <Text style={styles.codigo} selectable adjustsFontSizeToFit numberOfLines={1}>
          {reporte.codigo}
        </Text>
        {!reporte.sincronizado && (
          <Text style={styles.pendiente}>Pendiente de sincronización</Text>
        )}
      </View>

      <Text style={styles.mensaje}>
        {reporte.sincronizado
          ? "Guardá este número. Con él podés consultar cómo sigue tu reclamo."
          : "Quedó guardado en tu teléfono. Se sube solo cuando vuelva la señal y ahí te damos el número definitivo. No tenés que hacer nada."}
      </Text>

      {(avisos === "pendiente" || avisos === "bloqueado") && (
        <Pressable
          style={[styles.avisar, activando && styles.deshabilitado]}
          onPress={() => void activarAvisos()}
          disabled={activando}
          accessibilityRole="button"
        >
          <Icon name="notifications-outline" size={26} color={COLORES.texto} />
          <Text style={styles.avisarTexto}>Avisarme cuando cambie el estado</Text>
        </Pressable>
      )}
      {avisos === "activados" && (
        <Text style={styles.avisado}>Te vamos a avisar cuando cambie el estado.</Text>
      )}

      <Pressable style={styles.primario} onPress={onVerMisReportes} accessibilityRole="button">
        <Text style={styles.primarioTexto}>Ver mis reportes</Text>
      </Pressable>
      <Pressable style={styles.secundario} onPress={onTerminar} accessibilityRole="button">
        <Text style={styles.secundarioTexto}>Volver al inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    padding: 24,
    backgroundColor: COLORES.fondo,
  },
  titulo: { fontSize: 30, fontWeight: "800", color: COLORES.texto, textAlign: "center" },
  codigoCaja: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 6,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
  codigoEtiqueta: { fontSize: 18, color: COLORES.textoSuave },
  codigo: { fontSize: 32, fontWeight: "800", color: COLORES.texto },
  pendiente: { fontSize: 18, fontWeight: "700", color: "#B45309" },
  mensaje: { fontSize: 19, lineHeight: 27, color: COLORES.texto, textAlign: "center" },
  avisar: {
    alignSelf: "stretch",
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.linea,
    backgroundColor: COLORES.superficie,
  },
  avisarTexto: { fontSize: 18, fontWeight: "600", color: COLORES.texto },
  avisado: { fontSize: 17, fontWeight: "600", color: "#15803D", textAlign: "center" },
  deshabilitado: { opacity: 0.6 },
  primario: {
    alignSelf: "stretch",
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORES.primario,
  },
  primarioTexto: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  secundario: {
    alignSelf: "stretch",
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  secundarioTexto: { fontSize: 18, fontWeight: "600", color: COLORES.texto },
});
