import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Switch, ScrollView
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../hooks/useNotifications';

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

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [cropCount, setCropCount] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [selectedLang, setSelectedLang] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    checkNotifPermission();
    fetchStats();
  }, []);

  const checkNotifPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotifEnabled(status === 'granted');
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'crops'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      setCropCount(snap.size);

      let done = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.tasksDone) done += data.tasksDone;
      });

      // Count completed tasks
      const tasksQ = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('completed', '==', true)
      );
      const tasksSnap = await getDocs(tasksQ);
      setTasksDone(tasksSnap.size);
    } catch (e) {
      console.log('Error fetching stats:', e);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await registerForPushNotifications();
      setNotifEnabled(granted);
      if (granted) {
        Alert.alert('✅ Enabled', 'You will get daily 6 AM farm reminders');
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotifEnabled(false);
      Alert.alert('🔕 Disabled', 'You can re-enable anytime from Profile');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const displayName = user?.email
    ? user.email.split('@')[0]
    : 'Guest Farmer';

  const currentLang = LANGUAGES.find(l => l.code === selectedLang);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Avatar + name */}
      <View style={styles.topSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email ?? 'Anonymous User'}</Text>
        <Text style={styles.uid}>ID: {user?.uid?.slice(0, 16)}...</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{cropCount}</Text>
          <Text style={styles.statLabel}>Active{'\n'}Crops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{tasksDone}</Text>
          <Text style={styles.statLabel}>Tasks{'\n'}Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>🌾</Text>
          <Text style={styles.statLabel}>Annadata{'\n'}Farmer</Text>
        </View>
      </View>

      {/* Settings */}
      <Text style={styles.sectionTitle}>⚙️ Settings</Text>
      <View style={styles.settingsCard}>

        {/* Notification toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🔔 Daily 6 AM Reminders</Text>
            <Text style={styles.settingDesc}>
              Get today's farm task every morning
            </Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#2a2018', true: '#2d7a4a' }}
            thumbColor={notifEnabled ? '#3db870' : '#6a6050'}
          />
        </View>

        <View style={styles.divider} />

        {/* Language picker */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowLangPicker(!showLangPicker)}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🌐 Calendar Language</Text>
            <Text style={styles.settingDesc}>
              Currently: {currentLang?.label || 'English'}
            </Text>
          </View>
          <Text style={styles.chevron}>{showLangPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {/* Language options */}
        {showLangPicker && (
          <View style={styles.langGrid}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langChip,
                  selectedLang === lang.code && styles.langChipActive
                ]}
                onPress={() => {
                  setSelectedLang(lang.code);
                  setShowLangPicker(false);
                }}
              >
                <Text style={[
                  styles.langChipText,
                  selectedLang === lang.code && styles.langChipTextActive
                ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* App info */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🌾 Annadata</Text>
            <Text style={styles.settingDesc}>
              Version 1.0 · Built for Indian Farmers
            </Text>
          </View>
        </View>

      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Made with ❤️ for Indian Farmers</Text>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
    paddingHorizontal: 20,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 70,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2d7a4a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#eee8d8', marginBottom: 4 },
  email: { fontSize: 13, color: '#8a7a60', marginBottom: 4 },
  uid: { fontSize: 10, color: '#4a4030', fontFamily: 'monospace' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111a14',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statNum: { fontSize: 24, fontWeight: '700', color: '#f0b84a', marginBottom: 4 },
  statLabel: {
    fontSize: 10, color: '#6a6050',
    textAlign: 'center', lineHeight: 14,
  },

  sectionTitle: {
    fontSize: 12, fontWeight: '700',
    color: '#6a6050', letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Settings card
  settingsCard: {
    backgroundColor: '#111a14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  settingInfo: { flex: 1 },
  settingTitle: {
    fontSize: 14, fontWeight: '600',
    color: '#eee8d8', marginBottom: 3,
  },
  settingDesc: { fontSize: 11, color: '#6a6050', lineHeight: 16 },
  chevron: { color: '#6a6050', fontSize: 12 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
  },

  // Language grid
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    paddingTop: 0,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  langChipActive: {
    backgroundColor: '#2d7a4a',
    borderColor: '#2d7a4a',
  },
  langChipText: { color: '#6a6050', fontSize: 13, fontWeight: '600' },
  langChipTextActive: { color: '#fff' },

  logoutBtn: {
    borderWidth: 1, borderColor: '#c0392b',
    paddingVertical: 14, borderRadius: 50,
    alignItems: 'center', marginBottom: 16,
  },
  logoutText: { color: '#e57373', fontWeight: '700', fontSize: 15 },
  footer: { textAlign: 'center', fontSize: 11, color: '#2a2018', marginBottom: 8 },
});