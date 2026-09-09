import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Switch
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { scheduleDailyReminder, registerForPushNotifications } from '../hooks/useNotifications';

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    checkNotifPermission();
  }, []);

  const checkNotifPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotifEnabled(status === 'granted');
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await registerForPushNotifications();
      setNotifEnabled(granted);
      if (granted) {
        Alert.alert('✅ Notifications enabled', 'You will get daily 6 AM farm reminders');
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotifEnabled(false);
      Alert.alert('🔕 Notifications disabled', 'You can re-enable anytime');
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

  return (
    <View style={styles.container}>

      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarLetter}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.email}>{user?.email ?? 'Anonymous User'}</Text>
      <Text style={styles.uid}>ID: {user?.uid?.slice(0, 16)}...</Text>

      {/* Settings section */}
      <View style={styles.settingsCard}>

        {/* Notification toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🔔 Daily 6 AM Reminders</Text>
            <Text style={styles.settingDesc}>
              Get notified every morning with today's farm task
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

        {/* App info */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>🌾 Annadata</Text>
            <Text style={styles.settingDesc}>Version 1.0 · Built for Indian Farmers</Text>
          </View>
        </View>

      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Made with ❤️ for Indian Farmers</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2d7a4a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: {
    fontSize: 22, fontWeight: '700', color: '#eee8d8', marginBottom: 4,
  },
  email: { fontSize: 13, color: '#8a7a60', marginBottom: 4 },
  uid: {
    fontSize: 10, color: '#4a4030',
    fontFamily: 'monospace', marginBottom: 32,
  },

  settingsCard: {
    width: '100%',
    backgroundColor: '#111a14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 24,
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
    fontSize: 14, fontWeight: '600', color: '#eee8d8', marginBottom: 3,
  },
  settingDesc: { fontSize: 11, color: '#6a6050', lineHeight: 16 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
  },

  logoutBtn: {
    borderWidth: 1, borderColor: '#c0392b',
    paddingHorizontal: 48, paddingVertical: 14,
    borderRadius: 50, marginBottom: 24,
  },
  logoutText: { color: '#e57373', fontWeight: '700', fontSize: 15 },
  footer: { fontSize: 11, color: '#2a2018' },
});