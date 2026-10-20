import React, { useState, useEffect } from 'react';
import type { ComponentProps } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';

// Importamos usando las rutas de tu estructura real
import type { PayloadCrearReporte, Coordenadas, TipoDeReporte } from '@/tipos/reporte.interface';
import { crearReporte, obtenerTipos } from '@/servicios/reportesService';

type NombreIcono = ComponentProps<typeof Icon>['name'];

export default function NuevoReporteScreen() {
  const router = useRouter();
  
  // Estado para las categorías que vienen del servicio de tu compañera
  const [tiposReporte, setTiposReporte] = useState<TipoDeReporte[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(true);

  // Estados del formulario
  const [tipoId, setTipoId] = useState<string>('');
  const [fotoLocalUri, setFotoLocalUri] = useState<string | null>(null);
  const [coordenadas, setCoordenadas] = useState<Coordenadas>({ latitud: -32.484, longitud: -58.232 }); 
  const [direccion, setDireccion] = useState<string>('Rocamora 1240 - a 12 m de vos');
  const [descripcion, setDescripcion] = useState<string>('');
  
  const [isOffline, setIsOffline] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Cargar los tipos de reporte al iniciar la pantalla
  useEffect(() => {
    async function cargarCategorias() {
      try {
        const tipos = await obtenerTipos();
        setTiposReporte(tipos);
        if (tipos.length > 0) {
          setTipoId(tipos[0].id); // Seleccionamos el primero por defecto
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las categorías.');
      } finally {
        setCargandoTipos(false);
      }
    }
    cargarCategorias();
  }, []);

  const handleEnviar = async () => {
    if (!fotoLocalUri) {
      Alert.alert('Falta foto', 'La foto es obligatoria para el reporte.');
      return;
    }

    if (!tipoId) return;

    setGuardando(true);
    const payload: PayloadCrearReporte = {
      tipoId,
      fotoLocalUri,
      coordenadas,
      direccion,
      descripcion: descripcion.trim() !== '' ? descripcion : null,
      audioUrl: null // Se llenará cuando implementes expo-audio
    };

    try {
      // Llamamos a la función unificada del servicio
      await crearReporte(payload);
      Alert.alert('Guardado', 'El reporte se subirá al recuperar la señal.');
      router.back(); // Volvemos a la pantalla anterior
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el reporte localmente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Reporte</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        <Text style={styles.sectionTitle}>PASO 1: CATEGORÍA</Text>
        
        {cargandoTipos ? (
          <ActivityIndicator size="large" color="#1A202C" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.gridContainer}>
            {tiposReporte.map((tipo) => (
              <Pressable
                key={tipo.id}
                style={[styles.categoryCard, tipoId === tipo.id && styles.categoryCardSelected]}
                onPress={() => setTipoId(tipo.id)}
              >
                <Icon 
                  name={tipo.icono as NombreIcono} 
                  size={32} 
                  color={tipoId === tipo.id ? '#000' : '#8A92A6'} 
                />
                <Text style={[styles.categoryText, tipoId === tipo.id && styles.categoryTextSelected]}>
                  {tipo.nombre}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>PASO 2: FOTO (OBLIGATORIA)</Text>
        <TouchableOpacity 
          style={[styles.photoButton, fotoLocalUri && styles.photoButtonSuccess]} 
          onPress={() => setFotoLocalUri('file://ruta-simulada/foto.jpg')}
        >
          <Icon name={fotoLocalUri ? "checkmark-circle" : "camera-outline"} size={28} color={fotoLocalUri ? "#38A169" : "#8A92A6"} />
          <Text style={styles.photoText}>
            {fotoLocalUri ? "Foto adjuntada" : "Tomar foto (Obligatoria)"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>PASO 3: UBICACIÓN</Text>
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Icon name="location" size={48} color="#202A39" />
            <Text style={{marginTop: 8, color: '#718096'}}>{direccion}</Text>
          </View>
          <TouchableOpacity style={styles.mapButton}>
            <Icon name="location-outline" size={20} color="#000" />
            <Text style={styles.mapButtonText}>Corregir en el mapa</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>PASO 4: DETALLE</Text>
        <View style={styles.detailContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Escriba una descripción breve del problema..."
            multiline
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TouchableOpacity style={styles.audioButton}>
            <Icon name="mic-outline" size={24} color="#4A5568" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-offline-outline" size={20} color="#FFF" />
          <Text style={styles.offlineText}>Guardado. Se subirá al recuperar señal.</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, guardando && { opacity: 0.7 }]} 
          onPress={handleEnviar}
          disabled={guardando || cargandoTipos}
        >
          <Text style={styles.submitButtonText}>
            {guardando ? 'Guardando...' : 'Enviar reporte'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A202C' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#718096', marginBottom: 12, marginTop: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  categoryCard: { width: '31%', aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  categoryCardSelected: { borderColor: '#1A202C', borderWidth: 2 },
  categoryText: { marginTop: 8, fontSize: 13, color: '#718096', fontWeight: '500' },
  categoryTextSelected: { color: '#1A202C', fontWeight: '700' },
  photoButton: { backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E0', borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center', justifyContent: 'center' },
  photoButtonSuccess: { backgroundColor: '#F0FFF4', borderColor: '#9AE6B4', borderStyle: 'solid' },
  photoText: { marginTop: 10, fontSize: 14, color: '#4A5568', fontWeight: '500' },
  mapContainer: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  mapPlaceholder: { height: 120, backgroundColor: '#EDF2F7', alignItems: 'center', justifyContent: 'center' },
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8F9FA' },
  mapButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#1A202C' },
  detailContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  textInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 14 },
  audioButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A5568', padding: 12, paddingHorizontal: 20 },
  offlineText: { color: '#FFF', marginLeft: 10, fontSize: 13, fontWeight: '500' },
  footer: { padding: 20, backgroundColor: '#F8F9FA' },
  submitButton: { backgroundColor: '#1A202C', borderRadius: 30, padding: 18, alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});