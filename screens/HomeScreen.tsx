import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Props = { user: User };

export default function HomeScreen({ user }: Props) {
  const [cropCount, setCropCount] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning 🌅';
    if (h < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  const displayName = user.email
    ? user.email.split('@')[0]
    : 'Kisan';

  useEffect(() => {
    const fetchStats = async () => {
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
        setTasksDone(done);
      } catch (e) {
        // offline or no data yet — keep zeros
      }
    };
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.name}>
            {displayName.charAt(0).toUpperCase() + displayName.slice(1)} 🌾
          </Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
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
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Day{'\n'}Streak</Text>
        </View>
      </View>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🤖</Text>
        <Text style={styles.heroTitle}>
          {cropCount === 0
            ? 'Start Your First\nCrop Calendar'
            : 'Add Another Crop'}
        </Text>
        <Text style={styles.heroSub}>
          AI generates a personalized{'\n'}
          20-week farming plan for you
        </Text>
        <TouchableOpacity style={styles.heroBtn}>
          <Text style={styles.heroBtnText}>+ Add New Crop</Text>
        </TouchableOpacity>
      </View>

      {/* Tips section */}
      <Text style={styles.sectionTitle}>💡 Farming Tips</Text>
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          🌧️ Monsoon approaching — ideal time to prepare your Kharif crop plan
        </Text>
      </View>
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          🐛 Check for stem borer in paddy fields during early morning
        </Text>
      </View>
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          💧 Drip irrigation saves up to 50% water vs flood irrigation
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 13,
    color: '#6a6050',
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f0b84a',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2d7a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#f0b84a',
  },
  statLabel: {
    fontSize: 10,
    color: '#6a6050',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Hero card
  heroCard: {
    backgroundColor: '#111a14',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.15)',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEmoji: { fontSize: 44, marginBottom: 12 },
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

  // Tips
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8a7a60',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  tipCard: {
    backgroundColor: '#111a14',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  tipText: {
    fontSize: 13,
    color: '#8a7a60',
    lineHeight: 20,
  },
});