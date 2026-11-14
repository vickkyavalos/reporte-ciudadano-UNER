
// import { useCallback, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { useFocusEffect, useRouter } from "expo-router";
// import Ionicons from "@react-native-vector-icons/ionicons";

// import { TarjetaMiReporte } from "@/components/reportes/tarjeta-mi-reporte";
// import { COLORES } from "@/constants/estados";
// import { actualizarPreferenciaAvisos, obtenerUsuario } from "@/servicios/authService";
// import { obtenerAvisosUsuario } from "@/servicios/avisosService";
// import {
//   obtenerMisReportes,
//   obtenerTipos,
// } from "@/servicios/reportes";
// import type {
//   Reporte,
//   TipoDeReporte,
// } from "@/tipos/reporte.interface";
// import type { AvisoVecino } from "@/tipos/aviso.interface";

// export default function MisReportes() {
//   const router = useRouter();
//   const [reportes, setReportes] = useState<Reporte[]>([]);
//   const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
//   const [cargando, setCargando] = useState(true);
//   const [error, setError] = useState("");
//   const [avisos, setAvisos] = useState<AvisoVecino[]>([]);
//   const [avisosActivos, setAvisosActivos] = useState(false);
//   const [actualizandoAvisos, setActualizandoAvisos] = useState(false);

//   const cargar = useCallback(async () => {
//     setCargando(true);
//     setError("");

//     try {
//       const usuario = obtenerUsuario();
//       if (!usuario) throw new Error("Iniciá sesión para ver tus reportes.");
//       const [resultado, listaTipos, listaAvisos] = await Promise.all([
//         obtenerMisReportes(usuario.id),
//         obtenerTipos(),
//         obtenerAvisosUsuario(usuario.id),
//       ]);

//       setReportes(resultado.datos);
//       setTipos(listaTipos);
//       setAvisos(listaAvisos);
//       setAvisosActivos(usuario.avisosActivos);
//     } catch (e) {
//       setError(
//         e instanceof Error
//           ? e.message
//           : "No pudimos cargar tus reportes."
//       );
//     } finally {
//       setCargando(false);
//     }
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       void Promise.resolve().then(cargar);
//     }, [cargar])
//   );

//   const cambiarPreferenciaAvisos = async () => {
//     setActualizandoAvisos(true);
//     try {
//       const usuario = await actualizarPreferenciaAvisos(!avisosActivos);
//       setAvisosActivos(usuario.avisosActivos);
//     } catch (cause) {
//       setError(cause instanceof Error ? cause.message : "No se pudo actualizar la preferencia.");
//     } finally {
//       setActualizandoAvisos(false);
//     }
//   };

//   return (
//     <View style={styles.pantalla}>
//       <View style={styles.encabezado}>
//         <Text style={styles.titulo}>Mis Reportes</Text>
//         <Text style={styles.subtitulo}>
//           Consultá el estado de tus reclamos
//         </Text>
//       </View>

//       <View style={styles.avisos}>
//         <View style={styles.avisosTitulo}>
//           <View style={styles.avisosTexto}>
//             <Text style={styles.avisosLabel}>Avisos de tus reportes</Text>
//             <Text style={styles.avisosAyuda}>Cambios de estado y nuevas adhesiones</Text>
//           </View>
//           <Pressable
//             accessibilityRole="switch"
//             accessibilityState={{ checked: avisosActivos, disabled: actualizandoAvisos }}
//             accessibilityLabel="Activar o desactivar avisos"
//             disabled={actualizandoAvisos}
//             onPress={() => void cambiarPreferenciaAvisos()}
//             style={[styles.avisosToggle, avisosActivos && styles.avisosToggleActivo]}
//           >
//             <Text style={styles.avisosToggleTexto}>
//               {actualizandoAvisos ? "..." : avisosActivos ? "Activados" : "Desactivados"}
//             </Text>
//           </Pressable>
//         </View>
//         {avisosActivos && avisos.slice(0, 2).map((aviso) => (
//           <View key={aviso.id} style={styles.avisoCard}>
//             <Text style={styles.avisoTitulo}>{aviso.titulo}</Text>
//             <Text style={styles.avisoMensaje}>{aviso.mensaje}</Text>
//           </View>
//         ))}
//       </View>

//       {cargando ? (
//         <ActivityIndicator
//           size="large"
//           color={COLORES.primario}
//           style={styles.centrado}
//         />
//       ) : error ? (
//         <View style={styles.vacio}>
//           <Text style={styles.mensaje}>{error}</Text>
//           <Pressable style={styles.boton} onPress={cargar}>
//             <Text style={styles.botonTexto}>Reintentar</Text>
//           </Pressable>
//         </View>
//       ) : reportes.length === 0 ? (
//         <View style={styles.vacio}>
//           <Ionicons
//             name="document-text-outline"
//             size={48}
//             color={COLORES.textoSuave}
//           />
//           <Text style={styles.tituloVacio}>
//             Todavía no tenés reportes
//           </Text>
//           <Text style={styles.mensaje}>
//             Cuando hagas un reclamo, vas a poder consultar acá su estado.
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={reportes}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.lista}
//           showsVerticalScrollIndicator={false}
//           renderItem={({ item }) => (
//             <TarjetaMiReporte
//               reporte={item}
//               titulo={`${
//                 tipos.find((t) => t.id === item.tipoId)?.nombre ?? "Reporte"
//               } en ${item.direccion}`}
//                 fecha={new Date(item.creadoEn).toLocaleDateString("es-AR", {
//                   day: "2-digit",
//                   month: "short",
//                   year: "numeric",
//                   timeZone: "America/Argentina/Buenos_Aires",
//                 })}
//                 fotoUrl={
//                   item.fotos.find((foto) => foto.momento === "problema")?.url ??
//                   item.fotos[0]?.url ??
//                   null
//                 }
//                 onPress={() =>
//                   router.push({
//                     pathname: "/reportes/[id]",
//                     params: { id: item.id },
//                   })
//                 }
//               />
//             )}
          
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   pantalla: {
//     flex: 1,
//     backgroundColor: COLORES.fondo,
//   },
//   encabezado: {
//     paddingHorizontal: 20,
//     paddingTop: 22,
//     paddingBottom: 18,
//     backgroundColor: COLORES.superficie,
//   },
//   avisos: {
//     marginHorizontal: 16,
//     marginTop: 12,
//     padding: 12,
//     borderRadius: 10,
//     backgroundColor: COLORES.superficie,
//   },
//   avisosTitulo: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: 8,
//   },
//   avisosTexto: { flex: 1 },
//   avisosLabel: { color: COLORES.texto, fontSize: 13, fontWeight: "700" },
//   avisosAyuda: { marginTop: 3, color: COLORES.textoSuave, fontSize: 10 },
//   avisosToggle: {
//     minHeight: 34,
//     justifyContent: "center",
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: "#E5E7EB",
//   },
//   avisosToggleActivo: { backgroundColor: "#E6F6EC" },
//   avisosToggleTexto: { color: COLORES.texto, fontSize: 10, fontWeight: "700" },
//   avisoCard: { marginTop: 10, padding: 9, borderRadius: 8, backgroundColor: "#F5F7FA" },
//   avisoTitulo: { color: COLORES.texto, fontSize: 11, fontWeight: "700" },
//   avisoMensaje: { marginTop: 3, color: COLORES.textoSuave, fontSize: 11, lineHeight: 15 },
//   titulo: {
//     fontSize: 26,
//     fontWeight: "700",
//     color: COLORES.texto,
//   },
//   subtitulo: {
//     marginTop: 6,
//     fontSize: 14,
//     color: COLORES.textoSuave,
//   },
//   lista: {
//     padding: 16,
//     paddingBottom: 28,
//   },
//   centrado: {
//     marginTop: 40,
//   },
//   vacio: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 28,
//     gap: 14,
//   },
//   tituloVacio: {
//     fontSize: 19,
//     fontWeight: "700",
//     color: COLORES.texto,
//     textAlign: "center",
//   },
//   mensaje: {
//     fontSize: 15,
//     lineHeight: 22,
//     color: COLORES.textoSuave,
//     textAlign: "center",
//   },
//   boton: {
//     minHeight: 46,
//     paddingHorizontal: 24,
//     borderRadius: 10,
//     backgroundColor: COLORES.primario,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   botonTexto: {
//     color: "#FFFFFF",
//     fontWeight: "700",
//   },
// });


import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";

import { TarjetaMiReporte } from "@/components/reportes/tarjeta-mi-reporte";
import { COLORES } from "@/constants/estados";
import { actualizarPreferenciaAvisos, obtenerUsuario } from "@/servicios/authService";
import { obtenerAvisosUsuario } from "@/servicios/avisosService";
import { obtenerMisReportes, obtenerTipos } from "@/servicios/reportes";
import type { Reporte, TipoDeReporte } from "@/tipos/reporte.interface";
import type { AvisoVecino } from "@/tipos/aviso.interface";


export default function MisReportes() {
  const router = useRouter();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [avisos, setAvisos] = useState<AvisoVecino[]>([]);
  const [avisosActivos, setAvisosActivos] = useState(false);
  const [actualizandoAvisos, setActualizandoAvisos] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const usuario = obtenerUsuario();
      if (!usuario) throw new Error("Iniciá sesión para ver tus reportes.");

      const [resultado, listaTipos] = await Promise.all([
        obtenerMisReportes(usuario.id),
        obtenerTipos(),
      ]);

      setReportes(resultado.datos);
      setTipos(listaTipos);
      setAvisosActivos(usuario.avisosActivos);
      setAvisos(await obtenerAvisosUsuario(resultado.datos).catch(() => []));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos cargar tus reportes."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void Promise.resolve().then(cargar);
    }, [cargar])
  );

  const cambiarPreferenciaAvisos = async () => {
    setActualizandoAvisos(true);
    try {
      const usuario = await actualizarPreferenciaAvisos(!avisosActivos);
      setAvisosActivos(usuario.avisosActivos);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar la preferencia."
      );
    } finally {
      setActualizandoAvisos(false);
    }
  };

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Mis Reportes</Text>
        <Text style={styles.subtitulo}>Consultá el estado de tus reclamos</Text>
      </View>

      <View style={styles.avisos}>
        <View style={styles.avisosTitulo}>
          <View style={styles.avisosTexto}>
            <Text style={styles.avisosLabel}>Avisos de tus reportes</Text>
            <Text style={styles.avisosAyuda}>
              Cambios de estado y nuevas adhesiones
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{
              checked: avisosActivos,
              disabled: actualizandoAvisos,
            }}
            accessibilityLabel="Activar o desactivar avisos"
            disabled={actualizandoAvisos}
            onPress={() => void cambiarPreferenciaAvisos()}
            style={[
              styles.avisosToggle,
              avisosActivos && styles.avisosToggleActivo,
            ]}
          >
            <Text style={styles.avisosToggleTexto}>
              {actualizandoAvisos
                ? "..."
                : avisosActivos
                ? "Activados"
                : "Desactivados"}
            </Text>
          </Pressable>
        </View>
        {avisosActivos &&
          avisos.slice(0, 2).map((aviso) => (
            <View key={aviso.id} style={styles.avisoCard}>
              <Text style={styles.avisoTitulo}>{aviso.titulo}</Text>
              <Text style={styles.avisoMensaje}>{aviso.mensaje}</Text>
            </View>
          ))}
      </View>

      {cargando ? (
        <ActivityIndicator
          size="large"
          color={COLORES.primario}
          style={styles.centrado}
        />
      ) : error ? (
        <View style={styles.vacio}>
          <Text style={styles.mensaje}>{error}</Text>
          <Pressable style={styles.boton} onPress={cargar}>
            <Text style={styles.botonTexto}>Reintentar</Text>
          </Pressable>
        </View>
      ) : reportes.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={COLORES.textoSuave}
          />
          <Text style={styles.tituloVacio}>Todavía no tenés reportes</Text>
          <Text style={styles.mensaje}>
            Cuando hagas un reclamo, vas a poder consultar acá su estado.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TarjetaMiReporte
              reporte={item}
              titulo={`${
                tipos.find((t) => t.id === item.tipoId)?.nombre ?? "Reporte"
              } en ${item.direccion}`}
              fecha={new Date(item.creadoEn).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "America/Argentina/Buenos_Aires",
              })}
              fotoUrl={
                item.fotos.find((foto) => foto.momento === "problema")?.url ??
                item.fotos[0]?.url ??
                null
              }
              onPress={() =>
                router.push({
                  pathname: "/reportes/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORES.fondo },
  encabezado: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: COLORES.superficie,
  },
  avisos: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORES.superficie,
  },
  avisosTitulo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  avisosTexto: { flex: 1 },
  avisosLabel: { color: COLORES.texto, fontSize: 13, fontWeight: "700" },
  avisosAyuda: { marginTop: 3, color: COLORES.textoSuave, fontSize: 10 },
  avisosToggle: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  avisosToggleActivo: { backgroundColor: "#E6F6EC" },
  avisosToggleTexto: { color: COLORES.texto, fontSize: 10, fontWeight: "700" },
  avisoCard: {
    marginTop: 10,
    padding: 9,
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
  },
  avisoTitulo: { color: COLORES.texto, fontSize: 11, fontWeight: "700" },
  avisoMensaje: {
    marginTop: 3,
    color: COLORES.textoSuave,
    fontSize: 11,
    lineHeight: 15,
  },
  titulo: { fontSize: 26, fontWeight: "700", color: COLORES.texto },
  subtitulo: { marginTop: 6, fontSize: 14, color: COLORES.textoSuave },
  lista: { padding: 16, paddingBottom: 28 },
  centrado: { marginTop: 40 },
  vacio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  tituloVacio: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORES.texto,
    textAlign: "center",
  },
  mensaje: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORES.textoSuave,
    textAlign: "center",
  },
  boton: {
    minHeight: 46,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: COLORES.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { color: "#FFFFFF", fontWeight: "700" },
});
