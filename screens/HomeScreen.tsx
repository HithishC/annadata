import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { signOut, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

type Props = {
  user: User;
};

export default function HomeScreen({ user }: Props) {

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Jai Jawan, Jai Kisan 🌾</Text>
          <Text style={styles.subGreeting}>Welcome to Annadata</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={handleLogout}>
          <Text style={styles.avatarText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🌾</Text>
        <Text style={styles.heroTitle}>Start Your First{'\n'}Crop Calendar</Text>
        <Text style={styles.heroSub}>
          AI will generate a personalized{'\n'}
          20-week farming plan for you
        </Text>
        <TouchableOpacity style={styles.heroBtn}>
          <Text style={styles.heroBtnText}>+ Add New Crop</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Active Crops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Empty state */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🌱</Text>
        <Text style={styles.emptyTitle}>No crops yet</Text>
        <Text style={styles.emptyText}>
          Tap "Add New Crop" to generate{'\n'}your first AI farming calendar
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0b84a',
  },
  subGreeting: {
    fontSize: 12,
    color: '#6a6050',
    marginTop: 2,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18 },

  // Hero card
  heroCard: {
    backgroundColor: '#111a14',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.15)',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#eee8d8',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  heroSub: {
    fontSize: 13,
    color: '#6a6050',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  heroBtn: {
    backgroundColor: '#2d7a4a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 50,
  },
  heroBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

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
  statNum: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f0b84a',
  },
  statLabel: {
    fontSize: 10,
    color: '#6a6050',
    marginTop: 4,
    textAlign: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 20,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a4030',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#3a3025',
    textAlign: 'center',
    lineHeight: 20,
  },
});