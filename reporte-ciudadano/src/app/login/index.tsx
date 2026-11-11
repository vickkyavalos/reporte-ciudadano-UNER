import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cargando, setCargando] = useState(false);
	const { ingresar } = useAuth();

	const entrar = async () => {
		if (cargando) return;
		setError(null);
		setCargando(true);
		try {
			await ingresar(identifier, password);
		} catch (e: any) {
			setError(e?.mensaje ?? 'No pudimos iniciar sesión. Intente de nuevo.');
		} finally {
			setCargando(false);
		}
	};

	return (
		<View style={styles.screen}>
			<View style={styles.card}>
				<View style={styles.brandMark}>
					<Ionicons name="shield-outline" size={34} color="#536071" />
				</View>
				<Text style={styles.title}>Municipalidad</Text>

				<View style={styles.form}>
					<Text style={styles.label}>DNI o Correo electrónico</Text>
					<TextInput
						accessibilityLabel="DNI o Correo electrónico"
						autoCapitalize="none"
						autoCorrect={false}
						placeholder="Ej: norma@mail.com"
						placeholderTextColor="#747D8B"
						style={styles.input}
						value={identifier}
						onChangeText={setIdentifier}
					/>

					<Text style={[styles.label, styles.passwordLabel]}>Contraseña</Text>
					<View style={styles.passwordInput}>
						<TextInput
							accessibilityLabel="Contraseña"
							autoCapitalize="none"
							placeholder="••••••••••••"
							placeholderTextColor="#747D8B"
							secureTextEntry={!passwordVisible}
							style={styles.passwordTextInput}
							value={password}
							onChangeText={setPassword}
							onSubmitEditing={entrar}
						/>
						<Pressable
							accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							accessibilityRole="button"
							hitSlop={12}
							onPress={() => setPasswordVisible(!passwordVisible)}
						>
							<Ionicons
								name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
								size={26}
								color="#182232"
							/>
						</Pressable>
					</View>

					{error && (
						<Text accessibilityRole="alert" style={styles.error}>
							{error}
						</Text>
					)}

					<Pressable
						accessibilityRole="button"
						style={[styles.primaryButton, cargando && styles.disabled]}
						onPress={entrar}
						disabled={cargando}
					>
						{cargando ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.primaryText}>Ingresar</Text>
						)}
					</Pressable>
					<Pressable accessibilityRole="button" style={styles.biometricButton}>
						<Ionicons name="finger-print-outline" size={24} color="#202A39" />
						<Text style={styles.biometricText}>Acceso biométrico</Text>
					</Pressable>
					<Pressable accessibilityRole="button" style={styles.forgotButton}>
						<Text style={styles.forgotText}>Olvidé mi contraseña</Text>
					</Pressable>
				</View>
			</View>

			<View style={styles.footer}>
				<Text style={styles.footerHint}>¿No tiene una cuenta?</Text>
				<Pressable accessibilityRole="button" hitSlop={10}>
					<Text style={styles.registerText}>Registrarse</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 20,
		paddingTop: 34,
		paddingBottom: 60,
		backgroundColor: '#F4F5F7',
	},
	card: {
		width: '100%',
		maxWidth: 460,
		alignSelf: 'center',
		alignItems: 'center',
		paddingHorizontal: 23,
		paddingTop: 23,
		paddingBottom: 24,
		borderRadius: 8,
		backgroundColor: '#FFFFFF',
		shadowColor: '#182230',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.08,
		shadowRadius: 18,
		elevation: 4,
	},
	brandMark: {
		width: 64,
		height: 64,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10,
		borderRadius: 32,
		backgroundColor: '#F1F2F4',
	},
	title: { color: '#192232', fontSize: 24, fontWeight: '700', lineHeight: 30 },
	form: { width: '100%', marginTop: 20 },
	label: { marginBottom: 6, color: '#182232', fontSize: 16, fontWeight: '600' },
	input: {
		height: 52,
		paddingHorizontal: 12,
		borderWidth: 1.5,
		borderColor: '#202A39',
		borderRadius: 8,
		color: '#192232',
		fontSize: 18,
	},
	passwordLabel: { marginTop: 16 },
	passwordInput: {
		height: 52,
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 12,
		paddingRight: 12,
		borderWidth: 1.5,
		borderColor: '#202A39',
		borderRadius: 8,
	},
	passwordTextInput: { flex: 1, height: '100%', padding: 0, color: '#192232', fontSize: 18 },
	error: { marginTop: 12, color: '#B42318', fontSize: 16, fontWeight: '500' },
	primaryButton: {
		height: 54,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 20,
		borderRadius: 8,
		backgroundColor: '#202A39',
	},
	disabled: { opacity: 0.6 },
	primaryText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
	biometricButton: {
		height: 54,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		marginTop: 12,
		borderWidth: 1.5,
		borderColor: '#202A39',
		borderRadius: 8,
	},
	biometricText: { color: '#202A39', fontSize: 18, fontWeight: '700' },
	forgotButton: { alignSelf: 'center', marginTop: 14, paddingVertical: 8 },
	forgotText: { color: '#667085', fontSize: 16, textDecorationLine: 'underline' },
	footer: {
		position: 'absolute',
		right: 20,
		bottom: 18,
		left: 20,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 6,
	},
	footerHint: { color: '#7B8493', fontSize: 16 },
	registerText: { color: '#202A39', fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
});