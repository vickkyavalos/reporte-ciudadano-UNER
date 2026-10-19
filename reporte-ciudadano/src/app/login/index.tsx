import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { iniciarSesion } from '@/servicios/authService';

export default function LoginScreen() {
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [passwordVisible, setPasswordVisible] = useState(false);
	const router = useRouter();

	const entrar = async () => {
		await iniciarSesion(identifier, password);
		router.replace('/');
	};

	return (
		<View style={styles.screen}>
			<View style={styles.card}>
				<View style={styles.brandMark}>
					<Text style={styles.shield}>◇</Text>
				</View>
				<Text style={styles.title}>Municipalidad</Text>
				<View style={styles.badge}>
					<Text style={styles.badgeIcon}>♙</Text>
					<Text style={styles.badgeText}>Vista Senior Activa</Text>
				</View>

				<View style={styles.form}>
					<Text style={styles.label}>DNI o Correo electrónico</Text>
					<TextInput
						accessibilityLabel="DNI o Correo electrónico"
						autoCapitalize="none"
						autoCorrect={false}
						placeholder="Ej: 12.345.678-9"
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
						/>
						<Pressable
							accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							accessibilityRole="button"
							hitSlop={10}
							onPress={() => setPasswordVisible(!passwordVisible)}
						>
							<Text style={styles.eye}>◎</Text>
						</Pressable>
					</View>

					<Pressable accessibilityRole="button" style={styles.primaryButton} onPress={entrar}>
						<Text style={styles.primaryText}>Ingresar</Text>
					</Pressable>
					<Pressable accessibilityRole="button" style={styles.biometricButton}>
						<Text style={styles.biometricIcon}>◉</Text>
						<Text style={styles.biometricText}>Acceso biométrico</Text>
					</Pressable>
					<Pressable accessibilityRole="button" style={styles.forgotButton}>
						<Text style={styles.forgotText}>Olvidé mi contraseña</Text>
					</Pressable>
				</View>
			</View>

			<View style={styles.footer}>
				<Text style={styles.footerHint}>¿No tiene una cuenta?</Text>
				<Pressable accessibilityRole="button">
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
		paddingBottom: 20,
		backgroundColor: '#F4F5F7',
	},
	card: {
		width: '100%',
		maxWidth: 460,
		alignSelf: 'center',
		alignItems: 'center',
		paddingHorizontal: 23,
		paddingTop: 23,
		paddingBottom: 20,
		borderRadius: 8,
		backgroundColor: '#FFFFFF',
		shadowColor: '#182230',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.08,
		shadowRadius: 18,
		elevation: 4,
	},
	brandMark: {
		width: 56,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 9,
		borderRadius: 28,
		backgroundColor: '#F1F2F4',
	},
	shield: { color: '#536071', fontSize: 31, lineHeight: 38 },
	title: { color: '#192232', fontSize: 18, fontWeight: '700', lineHeight: 24 },
	badge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		marginTop: 7,
		paddingHorizontal: 9,
		paddingVertical: 3,
		borderRadius: 12,
		backgroundColor: '#EDF4FF',
	},
	badgeIcon: { color: '#1760D2', fontSize: 12 },
	badgeText: { color: '#175BC4', fontSize: 10, fontWeight: '500' },
	form: { width: '100%', marginTop: 17 },
	label: { marginBottom: 5, color: '#182232', fontSize: 11, fontWeight: '500' },
	input: {
		height: 37,
		paddingHorizontal: 10,
		borderWidth: 1.5,
		borderColor: '#202A39',
		borderRadius: 6,
		color: '#192232',
		fontSize: 14,
	},
	passwordLabel: { marginTop: 12 },
	passwordInput: {
		height: 37,
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 10,
		paddingRight: 9,
		borderWidth: 1.5,
		borderColor: '#202A39',
		borderRadius: 6,
	},
	passwordTextInput: { flex: 1, height: '100%', padding: 0, color: '#192232', fontSize: 14 },
	eye: { color: '#182232', fontSize: 19 },
	primaryButton: {
		height: 37,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 17,
		borderRadius: 6,
		backgroundColor: '#202A39',
	},
	primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
	biometricButton: {
		height: 37,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 9,
		marginTop: 11,
		borderWidth: 1.5,
		borderColor: '#202A39',
		borderRadius: 6,
	},
	biometricIcon: { color: '#202A39', fontSize: 17 },
	biometricText: { color: '#202A39', fontSize: 13, fontWeight: '700' },
	forgotButton: { alignSelf: 'center', marginTop: 11, paddingVertical: 1 },
	forgotText: { color: '#667085', fontSize: 12, textDecorationLine: 'underline' },
	footer: {
		position: 'absolute',
		right: 20,
		bottom: 18,
		left: 20,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 5,
	},
	footerHint: { color: '#7B8493', fontSize: 12 },
	registerText: { color: '#202A39', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});