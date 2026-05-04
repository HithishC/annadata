import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function ProfileScreen() {
  const user = auth.currentUser;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.name}>
        {user?.email ?? 'Guest Farmer'}
      </Text>
      <Text style={styles.uid}>ID: {user?.uid?.slice(0, 12)}...</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080f09', alignItems:'center', justifyContent:'center', padding: 24 },
  emoji: { fontSize: 56, marginBottom: 16 },
  name: { fontSize: 18, fontWeight: '700', color: '#eee8d8', marginBottom: 6 },
  uid: { fontSize: 11, color: '#4a4030', marginBottom: 40, fontFamily: 'monospace' },
  logoutBtn: { borderWidth: 1, borderColor: '#c0392b', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 50 },
  logoutText: { color: '#c0392b', fontWeight: '700', fontSize: 14 },
});