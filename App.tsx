import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <Text style={styles.wheat}>🌾</Text>
        <ActivityIndicator color="#f0b84a" size="large" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.wheat}>🌾</Text>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.sub}>Annadata is ready</Text>
        <Text style={styles.uid}>
          User: {user.uid.slice(0, 12)}...
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.wheat}>🌾</Text>
      <Text style={styles.title}>अन्नदाता</Text>
      <Text style={styles.sub}>Annadata</Text>
      <Text style={styles.tagline}>Sahi Waqt, Sahi Kaam</Text>
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.loginText}>Get Started 🌱</Text>
        }
      </TouchableOpacity>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wheat: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    color: '#f0b84a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sub: {
    fontSize: 18,
    color: '#b0a080',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#6a6050',
    fontStyle: 'italic',
    marginBottom: 48,
  },
  loginBtn: {
    backgroundColor: '#2d7a4a',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  uid: {
    fontSize: 11,
    color: '#6a6050',
    marginBottom: 32,
    fontFamily: 'monospace',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#2d7a4a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 50,
  },
  logoutText: {
    color: '#3db870',
    fontSize: 14,
    fontWeight: '600',
  },
});