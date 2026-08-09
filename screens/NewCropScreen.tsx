import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator,
  Platform,
} from 'react-native';
import { useState } from 'react';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';

const CROPS = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane',
  'Tomato', 'Onion', 'Groundnut', 'Ragi', 'Jowar',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

type Props = {
  onGenerate: (data: any) => void;
  onBack: () => void;
};

export default function NewCropScreen({ onGenerate, onBack }: Props) {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [sowingDate, setSowingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [variety, setVariety] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [generating, setGenerating] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleGPS = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to auto-fill your location');
        setLoadingGPS(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geocode.length > 0) {
        const place = geocode[0];
        const locationStr = place.district || place.city || place.region || 'Unknown';
        setLocation(locationStr);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not get location. Please enter manually.');
    }
    setLoadingGPS(false);
  };

  const validate = () => {
    if (!selectedCrop) {
      Alert.alert('Missing field', 'Please select a crop');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Missing field', 'Please enter your location');
      return false;
    }
    return true;
  };

  const handleGenerate = () => {
  if (!validate()) return;
  onGenerate({
    cropType: selectedCrop,
    sowingDate: formatDate(sowingDate),
    location: location.trim(),
    variety: variety.trim(),
    language: selectedLanguage,
  });
};

  const isReady = selectedCrop && location.trim();

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Crop</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* Crop Picker */}
        <Text style={styles.label}>Select Crop *</Text>
        <View style={styles.cropGrid}>
          {CROPS.map(crop => (
            <TouchableOpacity
              key={crop}
              style={[styles.cropChip, selectedCrop === crop && styles.cropChipActive]}
              onPress={() => setSelectedCrop(crop)}
            >
              <Text style={[styles.cropChipText, selectedCrop === crop && styles.cropChipTextActive]}>
                {crop}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Variety */}
        <Text style={styles.label}>Variety (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sona Masuri, HD-2967"
          placeholderTextColor="#3a3025"
          value={variety}
          onChangeText={setVariety}
        />

        {/* Sowing Date */}
        <Text style={styles.label}>Sowing Date *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(sowingDate)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={sowingDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSowingDate(date);
            }}
            minimumDate={new Date(2020, 0, 1)}
            maximumDate={new Date(2030, 11, 31)}
          />
        )}

        {/* Location */}
        <Text style={styles.label}>Location / District *</Text>
        <View style={styles.locationRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g. Mandya, Pune, Ludhiana"
            placeholderTextColor="#3a3025"
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity style={styles.gpsBtn} onPress={handleGPS} disabled={loadingGPS}>
            {loadingGPS
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.gpsBtnText}>📍 GPS</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Language Picker */}
        <Text style={styles.label}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langChip, selectedLanguage === lang.code && styles.langChipActive]}
              onPress={() => setSelectedLanguage(lang.code)}
            >
              <Text style={[styles.langChipText, selectedLanguage === lang.code && styles.langChipTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, !isReady && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!isReady || generating}
        >
          {generating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.generateBtnText}>
                {isReady ? '🤖 Generate Calendar' : 'Select crop + location first'}
              </Text>
          }
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f09' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { padding: 4 },
  backText: { color: '#3db870', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#eee8d8' },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a7a60',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 16,
  },

  // Crop grid
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cropChipActive: {
    backgroundColor: '#2d7a4a',
    borderColor: '#2d7a4a',
  },
  cropChipText: { color: '#6a6050', fontSize: 13, fontWeight: '600' },
  cropChipTextActive: { color: '#fff' },

  // Input
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#eee8d8',
    fontSize: 15,
    marginBottom: 4,
  },
  dateText: { color: '#eee8d8', fontSize: 15 },

  // Location row
  locationRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  gpsBtn: {
    backgroundColor: '#2d7a4a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  gpsBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Language
  langScroll: { marginBottom: 4 },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 8,
  },
  langChipActive: {
    backgroundColor: '#2d7a4a',
    borderColor: '#2d7a4a',
  },
  langChipText: { color: '#6a6050', fontSize: 13, fontWeight: '600' },
  langChipTextActive: { color: '#fff' },

  // Generate button
  generateBtn: {
    backgroundColor: '#2d7a4a',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  generateBtnDisabled: {
    backgroundColor: '#1a3a28',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});