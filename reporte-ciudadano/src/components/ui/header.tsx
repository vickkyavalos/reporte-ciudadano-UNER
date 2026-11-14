import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';

interface HeaderProps {
  titulo: string;
  avatarUrl?: string;
  onPressPerfil?: () => void;
}

export default function Header({ titulo, avatarUrl, onPressPerfil }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      <TouchableOpacity onPress={onPressPerfil} activeOpacity={0.7}>
        <View style={styles.avatarPlaceholder}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarIcon}>👤</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarIcon: {
    fontSize: 18,
  },
});