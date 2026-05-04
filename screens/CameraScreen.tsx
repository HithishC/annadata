import { View, Text, StyleSheet } from 'react-native';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📷</Text>
      <Text style={styles.title}>Crop Disease Detection</Text>
      <Text style={styles.sub}>Coming in Day 8</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080f09', alignItems:'center', justifyContent:'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#eee8d8', marginBottom: 6 },
  sub: { fontSize: 13, color: '#4a4030' },
});