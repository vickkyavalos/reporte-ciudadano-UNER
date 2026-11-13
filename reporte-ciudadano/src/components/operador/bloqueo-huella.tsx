import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { huellaDisponible, pedirHuella } from '@/servicios/huellaService';

export function BloqueoHuella({ children }: { children: ReactNode }) {
  const { salir } = useAuth();
  const [verificado, setVerificado] = useState(false);
  const [fallo, setFallo] = useState(false);

  const verificar = useCallback(async () => {
    setFallo(false);
    if (!(await huellaDisponible())) {
      setVerificado(true);
      return;
    }
    const ok = await pedirHuella();
    if (ok) setVerificado(true);
    else setFallo(true);
  }, []);

  useEffect(() => {
    void verificar();
  }, [verificar]);

  if (verificado) return <>{children}</>;

  return (
    <View style={styles.pantalla}>
      <Text style={styles.titulo}>Verificá tu identidad</Text>
      <Text style={styles.texto}>
        {fallo ? 'No pudimos confirmar tu huella.' : 'Apoyá tu dedo en el lector.'}
      </Text>
      {fallo && (
        <>
          <Pressable style={styles.boton} onPress={() => void verificar()}>
            <Text style={styles.botonTexto}>Reintentar</Text>
          </Pressable>
          <Pressable onPress={salir}>
            <Text style={styles.link}>Cerrar sesión</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: '#FFFFFF' },
  titulo: { fontSize: 22, fontWeight: '700', color: '#172033' },
  texto: { fontSize: 16, color: '#475467', textAlign: 'center' },
  boton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: '#202A39' },
  botonTexto: { color: '#FFFFFF', fontWeight: '700' },
  link: { color: '#B42318', fontSize: 15, marginTop: 6 },
});