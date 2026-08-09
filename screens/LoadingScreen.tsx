import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';

const MESSAGES = [
  '🌾 Analyzing your crop type...',
  '📅 Mapping your sowing date...',
  '📍 Adapting to your location...',
  '🤖 AI generating your calendar...',
  '✅ Almost ready...',
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.wheat}>🌾</Text>
      <ActivityIndicator color="#f0b84a" size="large" style={styles.spinner} />
      <Text style={styles.message}>{MESSAGES[msgIndex]}</Text>
      <Text style={styles.sub}>This takes 10–20 seconds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  wheat: {
    fontSize: 64,
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b0a080',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 12,
    color: '#4a4030',
    textAlign: 'center',
  },
});