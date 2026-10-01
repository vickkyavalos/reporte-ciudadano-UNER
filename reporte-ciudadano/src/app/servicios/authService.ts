import { LoginRequest, LoginResponse } from '../interfaces/auth.interface';

// Cambia esto por la IP de tu backend local o URL de producción
const API_URL = 'http://192.168.1.X:8080/api/auth'; 

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Error de autenticación');
    }

    return response.json();
  }
};
