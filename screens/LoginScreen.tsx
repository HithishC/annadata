import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native';
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { useFonts, DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { auth } from '../firebaseConfig';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#f0b84a" size="large" />
      </View>
    );
  }

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error: any) {
      const msg =
        error.code === 'auth/user-not-found' ? 'No account found with this email' :
        error.code === 'auth/wrong-password' ? 'Incorrect password' :
        error.code === 'auth/email-already-in-use' ? 'Email already registered. Please login.' :
        error.code === 'auth/invalid-email' ? 'Invalid email address' :
        error.code === 'auth/invalid-credential' ? 'Invalid email or password' :
        'Something went wrong. Try again.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.wheat}>🌾</Text>
          <Text style={[styles.appName, { fontFamily: 'DMSans_700Bold' }]}>अन्नदाता</Text>
          <Text style={[styles.appNameEn, { fontFamily: 'DMSans_400Regular' }]}>ANNADATA</Text>
          <View style={styles.divider} />
          <Text style={[styles.tagline, { fontFamily: 'DMSans_400Regular' }]}>
            Sahi Waqt, Sahi Kaam
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => { setMode('login'); setErrors({}); }}
          >
            <Text style={[styles.tabText, { fontFamily: 'DMSans_700Bold' },
              mode === 'login' && styles.tabTextActive]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => { setMode('signup'); setErrors({}); }}
          >
            <Text style={[styles.tabText, { fontFamily: 'DMSans_700Bold' },
              mode === 'signup' && styles.tabTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: 'DMSans_400Regular' }]}>Email</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="farmer@example.com"
            placeholderTextColor="#3a3025"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
          />
          {errors.email && (
            <Text style={[styles.errorText, { fontFamily: 'DMSans_400Regular' }]}>
              ⚠ {errors.email}
            </Text>
          )}
        </View>

        {/* Password input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: 'DMSans_400Regular' }]}>Password</Text>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder="Min 6 characters"
            placeholderTextColor="#3a3025"
            secureTextEntry
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
          />
          {errors.password && (
            <Text style={[styles.errorText, { fontFamily: 'DMSans_400Regular' }]}>
              ⚠ {errors.password}
            </Text>
          )}
        </View>

        {/* Main button */}
        <TouchableOpacity
          style={styles.mainBtn}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.mainBtnText, { fontFamily: 'DMSans_700Bold' }]}>
                {mode === 'login' ? 'Login →' : 'Create Account →'}
              </Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={[styles.orText, { fontFamily: 'DMSans_400Regular' }]}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* Google button — coming soon */}
        <TouchableOpacity style={styles.googleBtn} disabled>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={[styles.googleText, { fontFamily: 'DMSans_700Bold' }]}>
            Continue with Google
          </Text>
          <View style={styles.soonBadge}>
            <Text style={[styles.soonText, { fontFamily: 'DMSans_700Bold' }]}>Soon</Text>
          </View>
        </TouchableOpacity>

        {/* Guest login */}
        <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin} disabled={loading}>
          <Text style={[styles.guestText, { fontFamily: 'DMSans_400Regular' }]}>
            🌱 Continue as Guest
          </Text>
        </TouchableOpacity>

        <Text style={[styles.bottom, { fontFamily: 'DMSans_400Regular' }]}>
          Made with ❤️ for Indian Farmers · Free Forever
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  circle1: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(45,122,74,0.08)',
    top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(212,168,67,0.05)',
    bottom: 100, left: -60,
  },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 32 },
  wheat: { fontSize: 52, marginBottom: 8 },
  appName: { fontSize: 42, color: '#f0b84a', marginBottom: 2 },
  appNameEn: { fontSize: 11, color: '#6a6050', letterSpacing: 6, marginBottom: 12 },
  divider: { width: 40, height: 2, backgroundColor: 'rgba(212,168,67,0.3)', borderRadius: 2, marginBottom: 10 },
  tagline: { fontSize: 14, color: '#b0a080', fontStyle: 'italic' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#2d7a4a' },
  tabText: { color: '#4a4030', fontSize: 14 },
  tabTextActive: { color: '#fff' },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: { color: '#8a7a60', fontSize: 12, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#eee8d8', fontSize: 15,
  },
  inputError: { borderColor: '#c0392b' },
  errorText: { color: '#c0392b', fontSize: 12, marginTop: 4 },

  // Main button
  mainBtn: {
    backgroundColor: '#2d7a4a', borderRadius: 50,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  mainBtnText: { color: '#fff', fontSize: 16 },

  // Or divider
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  orText: { color: '#4a4030', fontSize: 12 },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 50, paddingVertical: 14, paddingHorizontal: 24,
    gap: 12, marginBottom: 12,
  },
  googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#fff', width: 24, textAlign: 'center' },
  googleText: { flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: 15 },
  soonBadge: { backgroundColor: 'rgba(212,168,67,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  soonText: { fontSize: 10, color: '#f0b84a' },

  // Guest
  guestBtn: { alignItems: 'center', paddingVertical: 14 },
  guestText: { color: '#4a4030', fontSize: 14 },

  bottom: { textAlign: 'center', fontSize: 11, color: '#2a2018', marginTop: 24 },
});