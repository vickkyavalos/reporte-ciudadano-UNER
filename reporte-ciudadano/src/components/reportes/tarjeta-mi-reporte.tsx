
import { Pressable, Image, StyleSheet, Text, View } from "react-native";
import type { Reporte } from "@/tipos/reporte.interface";
import { EstadoBadge } from "@/components/ui/text-estado";
import { COLORES } from "@/constants/estados";

interface Props {
    reporte: Reporte;
    titulo: string;
    fecha: string;
    fotoUrl: string | null;
    onPress: () => void;
}

export function TarjetaMiReporte({
    reporte,
    titulo,
    fecha,
    fotoUrl,
    onPress,
}: Props) {
    return (
        <Pressable
            style={styles.tarjeta}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalle: ${titulo}`}
    >
        <View style={styles.contenido}>
            <Text style={styles.titulo} numberOfLines={2}>
            {titulo}
            </Text>

        <View style={styles.inferior}>
            <Text style={styles.fecha}>{fecha}</Text>
            <EstadoBadge estado={reporte.estado} />
        </View>
        </View>

    {fotoUrl ? (
        <Image
            source={{ uri: fotoUrl }}
            style={styles.foto}
            accessibilityLabel="Foto del reclamo"
        />
    ) : (
        <View style={styles.sinFoto}>
            <Text style={styles.textoSinFoto}>Sin foto</Text>
        </View>
    )}
    </Pressable>
    );
}

const styles = StyleSheet.create({
    tarjeta: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORES.superficie,
        borderRadius: 13,
        padding: 12,
        marginBottom: 10,
        minHeight: 84,
        borderWidth: 1,
        borderColor: COLORES.linea,
        gap: 12,
    },
    contenido: {
    flex: 1,
    gap: 10,
    },
    titulo: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORES.texto,
    },
    inferior: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
    },
    fecha: {
        fontSize: 11,
        color: COLORES.textoSuave,
    },
    foto: {
        width: 54,
        height: 54,
        borderRadius: 9,
        backgroundColor: COLORES.fondo,
    },
    sinFoto: {
        width: 54,
        height: 54,
        borderRadius: 9,
        backgroundColor: COLORES.fondo,
        alignItems: "center",
        justifyContent: "center",
    },
    textoSinFoto: {
        fontSize: 10,
        color: COLORES.textoSuave,
    },
});
