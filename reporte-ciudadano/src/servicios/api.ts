import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const CLAVE_TOKEN = 'token';

export class ErrorApi extends Error {
	constructor(public codigo: string, public mensaje: string, public status?: number) {
		super(mensaje);
	}
}

export const api = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL, 
	timeout: 15000,
});

api.interceptors.request.use(async (config) => {
	console.log('→ pedido a', config.baseURL, config.url);
	const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

api.interceptors.response.use(
	(res) => {
		console.log('← respuesta', res.status, res.config.url);
		return res;
	},
	(err) => {
		console.log(
			'Error de API:',
			err.message,
			err.code,
			'HTTP',
			err.response?.status,
			err.config?.url,
		);
		const e = err.response?.data?.error;
		if (e) throw new ErrorApi(e.codigo, e.mensaje, err.response?.status);
		if (err.response) {
			throw new ErrorApi(
				'ERROR_HTTP',
				`La API respondió con un error HTTP ${err.response.status}.`,
				err.response.status,
			);
		}
		throw new ErrorApi('SIN_CONEXION', 'No pudimos conectarnos. Revise su conexión.');
	}
);