import React, { useState, useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { 
  useAudioRecorder, 
  useAudioPlayer, 
  AudioModule
} from 'expo-audio';// Importamos el reproductor
import type { PayloadCrearReporte, Coordenadas, TipoDeReporte } from '@/tipos/reporte.interface';
import { crearReporte, obtenerTipos } from '@/servicios/reportes';

type NombreIcono = ComponentProps<typeof Icon>['name'];

export default function NuevoReporteScreen() {
  const router = useRouter();
  
  const [tiposReporte, setTiposReporte] = useState<TipoDeReporte[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(true);

  const [tipoId, setTipoId] = useState<string>('');
  const [coordenadas, setCoordenadas] = useState<Coordenadas>({ latitud: -32.484, longitud: -58.232 }); 
  const [direccion, setDireccion] = useState<string>('Rocamora 1240 - a 12 m de vos');
  const [descripcion, setDescripcion] = useState<string>('');
  
  const [isOffline, setIsOffline] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // === FOTOS ===
  const [fotosUris, setFotosUris] = useState<string[]>([]);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // === AUDIO (Grabación y Reproducción) ===
  const audioRecorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    android: {
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
    ios: {
      audioQuality: 'max',
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  });
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(audioUri); // Inicializamos el reproductor con la URI generada

  useEffect(() => {
    async function cargarCategorias() {
      try {
        const tipos = await obtenerTipos();
        setTiposReporte(tipos);
        if (tipos.length > 0) {
          setTipoId(tipos[0].id);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las categorías.');
      } finally {
        setCargandoTipos(false);
      }
    }
    cargarCategorias();
  }, []);

  const handleAbrirCamara = async () => {
    if (!permisoCamara?.granted) {
      const result = await pedirPermisoCamara();
      if (!result.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar la foto.');
        return;
      }
    }
    setMostrarCamara(true);
  };

  const handleTomarFoto = async () => {
    if (cameraRef.current) {
      try {
        const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (foto) {
          setFotosUris((prev) => [...prev, foto.uri]);
          setMostrarCamara(false);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo capturar la foto');
      }
    }
  };

  const eliminarFoto = (index: number) => {
    setFotosUris((prev) => prev.filter((_, i) => i !== index));
  };

  // === LÓGICA DE AUDIO ACTUALIZADA ===
  const toggleGrabacion = async () => {
    try {
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
        setAudioUri(audioRecorder.uri);
      } else {
        const permiso = await AudioModule.requestRecordingPermissionsAsync();
        if (permiso.granted) {
          await audioRecorder.record();
          setAudioUri(null); 
        } else {
          Alert.alert('Permiso denegado', 'Se requiere acceso al micrófono para grabar el detalle.');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo procesar la grabación de audio.');
    }
  };

  const eliminarAudio = () => {
    setAudioUri(null);
  };

  const handleEnviar = async () => {
    if (fotosUris.length === 0) {
      Alert.alert('Falta foto', 'Es obligatorio incluir al menos una foto del problema.');
      return;
    }
    if (!tipoId) return;

    setGuardando(true);
    const payload: PayloadCrearReporte = { 
      tipoId,
      fotosUris, 
      coordenadas,
      direccion,
      descripcion: descripcion.trim() !== '' ? descripcion : null,
      audioUrl: audioUri 
    };

    try {
      const reporteGenerado = await crearReporte(payload);
      Alert.alert('Reporte guardado', `Tu número de seguimiento es ${reporteGenerado.codigo}. Se enviará al recuperar la señal.`);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el reporte localmente.');
    } finally {
      setGuardando(false);
    }
  };

  if (mostrarCamara) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.cameraCloseButton} onPress={() => setMostrarCamara(false)}>
            <Icon name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureButton} onPress={handleTomarFoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
                <Icon name={tipo.icono as NombreIcono} size={32} color={tipoId === tipo.id ? '#000' : '#8A92A6'} />
                <Text style={[styles.categoryText, tipoId === tipo.id && styles.categoryTextSelected]}>
                  {tipo.nombre}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>PASO 2: FOTOS (OBLIGATORIA)</Text>
        {fotosUris.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosContainer}>
            {fotosUris.map((uri, index) => (
              <View key={index} style={styles.fotoPreviewContainer}>
                <Image source={{ uri }} style={styles.fotoPreview} />
                <TouchableOpacity style={styles.eliminarFotoBtn} onPress={() => eliminarFoto(index)}>
                  <Icon name="close-circle" size={24} color="#E53E3E" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addMorePhotosBtn} onPress={handleAbrirCamara}>
              <Icon name="add" size={32} color="#4A5568" />
              <Text style={{ fontSize: 12, color: '#4A5568', marginTop: 4 }}>Otra foto</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <TouchableOpacity style={styles.photoButton} onPress={handleAbrirCamara}>
            <Icon name="camera-outline" size={28} color="#8A92A6" />
            <Text style={styles.photoText}>Tomar foto (Obligatoria)</Text>
          </TouchableOpacity>
        )}

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
          
          <View style={styles.audioContainer}>
            {/* Si NO hay audio grabado, mostramos el botón de grabar/detener */}
            {!audioUri ? (
              <TouchableOpacity 
                style={[styles.audioButton, audioRecorder.isRecording && styles.audioButtonRecording]} 
                onPress={toggleGrabacion}
              >
                <Icon name={audioRecorder.isRecording ? "stop" : "mic-outline"} size={24} color={audioRecorder.isRecording ? "#FFF" : "#4A5568"} />
              </TouchableOpacity>
            ) : (
              /* Si hay audio grabado, mostramos los controles de reproducción */
              <View style={styles.audioPreview}>
                <TouchableOpacity onPress={() => audioPlayer.playing ? audioPlayer.pause() : audioPlayer.play()}>
                  <Icon name={audioPlayer.playing ? "pause-circle" : "play-circle"} size={36} color="#1A202C" />
                </TouchableOpacity>
                <TouchableOpacity onPress={eliminarAudio} style={{ marginLeft: 8 }}>
                  <Icon name="trash-outline" size={24} color="#E53E3E" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-offline-outline" size={20} color="#FFF" />
          <Text style={styles.offlineText}>Guardado. Se subirá al recuperar señal.</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitButton, guardando && { opacity: 0.7 }]} onPress={handleEnviar} disabled={guardando || cargandoTipos}>
          <Text style={styles.submitButtonText}>{guardando ? 'Guardando...' : 'Enviar reporte'}</Text>
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
  photoText: { marginTop: 10, fontSize: 14, color: '#4A5568', fontWeight: '500' },
  
  fotosContainer: { flexDirection: 'row', paddingVertical: 10 },
  fotoPreviewContainer: { position: 'relative', marginRight: 15 },
  fotoPreview: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  eliminarFotoBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 12 },
  addMorePhotosBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' },

  mapContainer: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  mapPlaceholder: { height: 120, backgroundColor: '#EDF2F7', alignItems: 'center', justifyContent: 'center' },
  mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8F9FA' },
  mapButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#1A202C' },
  
  detailContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  textInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 14 },
  
  audioContainer: { alignItems: 'center', justifyContent: 'center', width: 60 },
  audioButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  audioButtonRecording: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  audioPreview: { alignItems: 'center', justifyContent: 'center', gap: 8 },

  offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A5568', padding: 12, paddingHorizontal: 20 },
  offlineText: { color: '#FFF', marginLeft: 10, fontSize: 13, fontWeight: '500' },
  footer: { padding: 20, backgroundColor: '#F8F9FA' },
  submitButton: { backgroundColor: '#1A202C', borderRadius: 30, padding: 18, alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  cameraCloseButton: { alignSelf: 'flex-start', marginTop: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  cameraControls: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  captureButtonInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF' },
});