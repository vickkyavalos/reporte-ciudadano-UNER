export interface LoginRequest {
  email: string; // Puede ser DNI o Email según lo maneje tu backend
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}
