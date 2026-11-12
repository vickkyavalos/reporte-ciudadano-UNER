import * as LocalAuthentication from 'expo-local-authentication';

export async function huellaDisponible(): Promise<boolean> {
  const hayLector = await LocalAuthentication.hasHardwareAsync();
  const hayHuella = await LocalAuthentication.isEnrolledAsync();
  return hayLector && hayHuella;
}

export async function pedirHuella(): Promise<boolean> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirmá tu identidad para entrar',
    cancelLabel: 'Cancelar',
  });
  return resultado.success;
}