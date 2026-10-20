import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ESTADOS } from "@/constants/estados";
import {
  actualizarEstadoReclamoOperador,
  obtenerReclamosOperador,
} from "@/servicios/operadorService";
import type {
  CampoFiltroOperador,
  FiltroEstadoOperador,
  OrdenBandejaOperador,
  ReclamoOperador,
} from "@/tipos/operador.interface";
import type { EstadoReporte } from "@/tipos/reporte.interface";

const RECLAMOS_POR_PAGINA = 6;

const opcionesEstado: { valor: FiltroEstadoOperador; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "recibido", etiqueta: "Pendiente" },
  { valor: "en_revision", etiqueta: "En revisión" },
  { valor: "asignado", etiqueta: "Asignado" },
  { valor: "resuelto", etiqueta: "Resuelto" },
  { valor: "rechazado", etiqueta: "Rechazado" },
];

const etiquetaEstado = (estado: EstadoReporte) =>
  estado === "recibido" ? "Pendiente" : ESTADOS[estado].etiqueta;

const colorEstado = (estado: EstadoReporte) => {
  if (estado === "recibido") {
    return { ...ESTADOS[estado], fondo: "#FFF2CC", texto: "#A16207", borde: "#F6D98A" };
  }
  if (estado === "en_revision") {
    return { ...ESTADOS[estado], fondo: "#E6F0FF", texto: "#2563EB", borde: "#C5D8FF" };
  }
  return ESTADOS[estado];
};

const formatoFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(fecha))
    .replace(".", "");

export default function OperadorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reclamos, setReclamos] = useState<ReclamoOperador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoOperador>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroZona, setFiltroZona] = useState<string | null>(null);
  const [orden, setOrden] = useState<OrdenBandejaOperador>("recientes");
  const [pagina, setPagina] = useState(0);
  const [campoAbierto, setCampoAbierto] = useState<CampoFiltroOperador | null>(null);
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState<ReclamoOperador | null>(null);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const cargarReclamos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setReclamos(await obtenerReclamosOperador());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los reclamos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(cargarReclamos);
  }, [cargarReclamos]);

  const tipos = useMemo(
    () => [...new Set(reclamos.map((reclamo) => reclamo.tipo))].sort((a, b) => a.localeCompare(b, "es")),
    [reclamos]
  );
  const zonas = useMemo(
    () => [...new Set(reclamos.map((reclamo) => reclamo.zona))].sort((a, b) => a.localeCompare(b, "es")),
    [reclamos]
  );

  const reclamosFiltrados = useMemo(() => {
    const filtrados = reclamos.filter(
      (reclamo) =>
        (filtroEstado === "todos" || reclamo.estado === filtroEstado) &&
        (filtroTipo === null || reclamo.tipo === filtroTipo) &&
        (filtroZona === null || reclamo.zona === filtroZona)
    );
    return filtrados.sort((a, b) =>
      orden === "recientes"
        ? b.creadoEn.localeCompare(a.creadoEn)
        : a.creadoEn.localeCompare(b.creadoEn)
    );
  }, [filtroEstado, filtroTipo, filtroZona, orden, reclamos]);

  const totalPaginas = Math.max(1, Math.ceil(reclamosFiltrados.length / RECLAMOS_POR_PAGINA));
  const paginaVisible = Math.min(pagina, totalPaginas - 1);
  const reclamosPagina = reclamosFiltrados.slice(
    paginaVisible * RECLAMOS_POR_PAGINA,
    (paginaVisible + 1) * RECLAMOS_POR_PAGINA
  );

  const opcionesFiltro = useMemo(() => {
    if (campoAbierto === "estado") {
      return opcionesEstado.map(({ valor, etiqueta }) => ({ valor, etiqueta }));
    }
    if (campoAbierto === "tipo") {
      return [
        { valor: "", etiqueta: "Todos" },
        ...tipos.map((tipo) => ({ valor: tipo, etiqueta: tipo })),
      ];
    }
    if (campoAbierto === "zona") {
      return [
        { valor: "", etiqueta: "Todas" },
        ...zonas.map((zona) => ({ valor: zona, etiqueta: zona })),
      ];
    }
    return [];
  }, [campoAbierto, tipos, zonas]);

  const valorFiltro = (campo: CampoFiltroOperador) => {
    if (campo === "estado") {
      return opcionesEstado.find((opcion) => opcion.valor === filtroEstado)?.etiqueta ?? "Estado";
    }
    if (campo === "tipo") return filtroTipo ?? "Tipo";
    return filtroZona ?? "Zona";
  };

  const aplicarOpcion = (valor: string) => {
    setPagina(0);
    if (campoAbierto === "estado") setFiltroEstado(valor as FiltroEstadoOperador);
    if (campoAbierto === "tipo") setFiltroTipo(valor || null);
    if (campoAbierto === "zona") setFiltroZona(valor || null);
    setCampoAbierto(null);
  };

  const cambiarEstado = async (estado: EstadoReporte) => {
    if (!reclamoSeleccionado) return;
    setActualizandoEstado(true);
    setErrorEstado(null);
    try {
      const actualizado = await actualizarEstadoReclamoOperador(reclamoSeleccionado.id, estado);
      setReclamos((actuales) =>
        actuales.map((reclamo) => (reclamo.id === actualizado.id ? actualizado : reclamo))
      );
      setReclamoSeleccionado(actualizado);
    } catch (cause) {
      setErrorEstado(cause instanceof Error ? cause.message : "No se pudo actualizar el estado.");
    } finally {
      setActualizandoEstado(false);
    }
  };

  const renderReclamo = (item: ReclamoOperador) => {
    const estado = colorEstado(item.estado);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.tipo} en ${item.direccion}. Estado: ${etiquetaEstado(item.estado)}. Ver detalle`}
        onPress={() => {
          setErrorEstado(null);
          setReclamoSeleccionado(item);
        }}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.code}>{item.codigo}</Text>
            <Text style={[styles.badge, { color: estado.texto, backgroundColor: estado.fondo }]}>
              {etiquetaEstado(item.estado)}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {item.tipo} • {item.direccion}
          </Text>
          <Text numberOfLines={1} style={styles.rowMeta}>
            {item.zona} • {formatoFecha(item.creadoEn)} • {item.adhesiones} vecinos
          </Text>
        </View>
        <Text style={styles.rowChevron}>›</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Bandeja del operador</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil del operador"
          onPress={() => router.push("/login")}
          style={styles.profileButton}
        >
          <Text style={styles.profileIcon}>•</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {(["estado", "tipo", "zona"] as const).map((campo) => (
          <Pressable
            key={campo}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${campo}: ${valorFiltro(campo)}`}
            onPress={() => setCampoAbierto(campo)}
            style={styles.filterButton}
          >
            <Text numberOfLines={1} style={styles.filterLabel}>{valorFiltro(campo)}</Text>
            <Text style={styles.filterChevron}>⌄</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.resultsBar}>
          <Text style={styles.count}>{reclamosFiltrados.length} reclamos</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ordenar por ${orden === "recientes" ? "más antiguos" : "más recientes"}`}
            onPress={() => {
              setPagina(0);
              setOrden((actual) => (actual === "recientes" ? "antiguos" : "recientes"));
            }}
            style={styles.sortButton}
          >
            <Text style={styles.sortText}>
              {orden === "recientes" ? "Más recientes" : "Más antiguos"} ↓
            </Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeading}>RECLAMO / UBICACIÓN</Text>
            <Text style={styles.tableHeading}>ESTADO</Text>
          </View>
          {cargando ? (
            <ActivityIndicator color="#1A202C" style={styles.loading} />
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void cargarReclamos()} style={styles.retryButton}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : reclamosFiltrados.length === 0 ? (
            <Text style={styles.emptyState}>No hay reclamos que coincidan con esos filtros.</Text>
          ) : (
            reclamosPagina.map((item) => <View key={item.id}>{renderReclamo(item)}</View>)
          )}
          {!cargando && !error && (
            <View style={styles.pagination}>
              <Text style={styles.paginationCount}>
                {reclamosFiltrados.length === 0
                  ? "Sin reclamos"
                  : `${paginaVisible * RECLAMOS_POR_PAGINA + 1}–${Math.min(
                      (paginaVisible + 1) * RECLAMOS_POR_PAGINA,
                      reclamosFiltrados.length
                    )} de ${reclamosFiltrados.length} reclamos`}
              </Text>
              <View style={styles.paginationControls}>
                <Text style={styles.paginationPage}>{paginaVisible + 1} / {totalPaginas}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Página anterior"
                  disabled={paginaVisible === 0}
                  onPress={() => setPagina(Math.max(0, paginaVisible - 1))}
                  style={styles.pageButton}
                >
                  <Text style={[styles.pageChevron, paginaVisible === 0 && styles.pageDisabled]}>‹</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Página siguiente"
                  disabled={paginaVisible + 1 >= totalPaginas}
                  onPress={() => setPagina(Math.min(totalPaginas - 1, paginaVisible + 1))}
                  style={styles.pageButton}
                >
                  <Text style={[styles.pageChevron, paginaVisible + 1 >= totalPaginas && styles.pageDisabled]}>›</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={campoAbierto !== null}
        onRequestClose={() => setCampoAbierto(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCampoAbierto(null)}>
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Filtrar por {campoAbierto}</Text>
            <ScrollView style={styles.optionsList}>
              {opcionesFiltro.map((opcion) => (
                <Pressable
                  key={opcion.valor}
                  onPress={() => aplicarOpcion(opcion.valor)}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>{opcion.etiqueta}</Text>
                  {opcion.etiqueta === (campoAbierto ? valorFiltro(campoAbierto) : "")
                    && <Text style={styles.optionCheck}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={reclamoSeleccionado !== null}
        onRequestClose={() => setReclamoSeleccionado(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReclamoSeleccionado(null)}>
          {reclamoSeleccionado && (
            <Pressable style={styles.detailCard} onPress={(event) => event.stopPropagation()}>
              <View style={styles.detailHandle} />
              <View style={styles.detailHeading}>
                <Text style={styles.detailTitle}>Detalle del reclamo</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar detalle"
                  onPress={() => setReclamoSeleccionado(null)}
                >
                  <Text style={styles.closeButton}>×</Text>
                </Pressable>
              </View>
              <Text style={styles.detailCode}>{reclamoSeleccionado.codigo}</Text>
              <Text style={styles.detailIssue}>
                {reclamoSeleccionado.tipo} • {reclamoSeleccionado.direccion}
              </Text>
              <Text style={styles.detailMeta}>
                {reclamoSeleccionado.zona} • {formatoFecha(reclamoSeleccionado.creadoEn)}
              </Text>
              <Text style={styles.description}>{reclamoSeleccionado.descripcion}</Text>
              <Text style={styles.sectionLabel}>ESTADO DEL RECLAMO</Text>
              <View style={styles.statusOptions}>
                {(["recibido", "en_revision", "asignado", "resuelto", "rechazado"] as const).map((estado) => {
                  const selected = reclamoSeleccionado.estado === estado;
                  const color = colorEstado(estado);
                  return (
                    <Pressable
                      key={estado}
                      accessibilityRole="button"
                      disabled={selected || actualizandoEstado}
                      onPress={() => void cambiarEstado(estado)}
                      style={[
                        styles.statusOption,
                        { backgroundColor: selected ? color.fondo : "#FFFFFF", borderColor: color.borde },
                      ]}
                    >
                      <Text style={[styles.statusOptionText, { color: color.texto }]}>
                        {etiquetaEstado(estado)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {actualizandoEstado && <ActivityIndicator color="#1A202C" style={styles.statusLoading} />}
              {errorEstado && <Text style={styles.errorText}>{errorEstado}</Text>}
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F2F3F5" },
  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#172033" },
  profileButton: {
    width: 32, height: 32, alignItems: "center", justifyContent: "center",
    borderRadius: 16, backgroundColor: "#F2F3F5", borderWidth: 1, borderColor: "#E5E7EB",
  },
  profileIcon: { color: "#526071", fontSize: 18, lineHeight: 22 },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  filterButton: {
    height: 38, flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 9, borderWidth: 1,
    borderColor: "#D5DAE1", borderRadius: 7, backgroundColor: "#FFFFFF",
  },
  filterLabel: { flex: 1, color: "#263246", fontSize: 12, fontWeight: "500" },
  filterChevron: { marginLeft: 5, color: "#667085", fontSize: 16 },
  resultsBar: {
    minHeight: 40, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 15,
  },
  content: { flex: 1 },
  contentInner: { paddingBottom: 12 },
  count: { color: "#1F2937", fontSize: 13, fontWeight: "700" },
  sortButton: { paddingVertical: 8, paddingLeft: 10 },
  sortText: { color: "#717B8A", fontSize: 11 },
  listCard: {
    marginHorizontal: 14, overflow: "hidden", borderRadius: 10,
    borderWidth: 1, borderColor: "#E0E4E9", backgroundColor: "#FFFFFF",
  },
  tableHeader: {
    height: 27, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 9, backgroundColor: "#F6F7F9",
    borderBottomWidth: 1, borderBottomColor: "#E6E8EC",
  },
  tableHeading: { color: "#687386", fontSize: 8, fontWeight: "700" },
  row: {
    minHeight: 66, flexDirection: "row", alignItems: "center",
    paddingLeft: 9, paddingRight: 12, borderBottomWidth: 1, borderBottomColor: "#E8EBEF",
  },
  rowPressed: { backgroundColor: "#F8FAFC" },
  rowContent: { flex: 1, gap: 3 },
  rowTop: { minHeight: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  code: { color: "#687386", fontSize: 9, fontWeight: "500" },
  badge: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, fontSize: 9, fontWeight: "600" },
  rowTitle: { color: "#202A39", fontSize: 11, fontWeight: "700" },
  rowMeta: { color: "#798394", fontSize: 9 },
  rowChevron: { marginLeft: 9, color: "#667085", fontSize: 23, lineHeight: 25 },
  pagination: {
    minHeight: 39, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 9, borderTopWidth: 1, borderTopColor: "#E6E8EC",
  },
  paginationCount: { color: "#7B8492", fontSize: 9 },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  paginationPage: { color: "#172033", fontSize: 10, fontWeight: "600" },
  pageButton: { minWidth: 20, alignItems: "center" },
  pageChevron: { color: "#475467", fontSize: 22, lineHeight: 24 },
  pageDisabled: { color: "#C5CAD1" },
  loading: { paddingVertical: 32 },
  emptyState: { alignItems: "center", padding: 24, color: "#687386", fontSize: 12, textAlign: "center" },
  errorText: { color: "#B42318", fontSize: 12, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: "#202A39" },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  modalBackdrop: {
    flex: 1, justifyContent: "center", paddingHorizontal: 20,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  optionsCard: {
    maxHeight: "70%", overflow: "hidden", padding: 16,
    borderRadius: 14, backgroundColor: "#FFFFFF",
  },
  optionsTitle: { marginBottom: 8, color: "#172033", fontSize: 16, fontWeight: "700" },
  optionsList: { flexGrow: 0 },
  option: {
    minHeight: 46, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EDF0F2",
  },
  optionText: { color: "#344054", fontSize: 14 },
  optionCheck: { color: "#1570EF", fontSize: 16, fontWeight: "700" },
  detailCard: {
    marginTop: "auto", marginHorizontal: -20, paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: 28, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: "#FFFFFF",
  },
  detailHandle: { width: 38, height: 4, alignSelf: "center", marginBottom: 14, borderRadius: 2, backgroundColor: "#D0D5DD" },
  detailHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailTitle: { color: "#172033", fontSize: 17, fontWeight: "700" },
  closeButton: { paddingHorizontal: 4, color: "#667085", fontSize: 27, lineHeight: 29 },
  detailCode: { marginTop: 10, color: "#667085", fontSize: 11 },
  detailIssue: { marginTop: 5, color: "#202A39", fontSize: 15, fontWeight: "700" },
  detailMeta: { marginTop: 5, color: "#798394", fontSize: 12 },
  description: { marginTop: 14, color: "#475467", fontSize: 13, lineHeight: 19 },
  sectionLabel: { marginTop: 20, marginBottom: 9, color: "#667085", fontSize: 10, fontWeight: "700" },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusOption: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderRadius: 16 },
  statusOptionText: { fontSize: 11, fontWeight: "600" },
  statusLoading: { marginTop: 12 },
});
