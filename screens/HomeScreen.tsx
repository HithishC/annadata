import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl,
} from 'react-native';
import { User } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Props = {
  user: User;
  onAddCrop: () => void;
};

type Crop = {
  id: string;
  cropType: string;
  sowingDate: string;
  location: string;
  language: string;
  tasksDone: number;
};

type Task = {
  id: string;
  title: string;
  type: string;
  completed: boolean;
  cropId: string;
};

const CROP_ICONS: Record<string, string> = {
  Rice: '🌾', Wheat: '🌾', Maize: '🌽',
  Onion: '🧅', Tomato: '🍅', Sugarcane: '🌿',
  Cotton: '☁️', Groundnut: '🥜', Ragi: '🌾', Jowar: '🌾',
};

const TASK_COLORS: Record<string, string> = {
  water: '#4fc3f7',
  fertilize: '#81c784',
  pest: '#e57373',
  harvest: '#f0b84a',
  prepare: '#ce93d8',
  general: '#8a7a60',
};

export default function HomeScreen({ user, onAddCrop }: Props) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [nextTasks, setNextTasks] = useState<Record<string, Task>>({});
  const [totalTasksDone, setTotalTasksDone] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning 🌅';
    if (h < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  const displayName = user.email
    ? user.email.split('@')[0]
    : 'Kisan';

  const fetchData = async () => {
    if (!user) return;
    try {
      // Fetch all crops
      const cropsQ = query(
        collection(db, 'crops'),
        where('userId', '==', user.uid)
      );
      const cropsSnap = await getDocs(cropsQ);
      const cropList: Crop[] = cropsSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Crop));
      setCrops(cropList);

      // Fetch next incomplete task for each crop
      const taskMap: Record<string, Task> = {};
      let doneCount = 0;

      for (const crop of cropList) {
        const tasksQ = query(
          collection(db, 'tasks'),
          where('cropId', '==', crop.id),
          where('completed', '==', false)
        );
        const tasksSnap = await getDocs(tasksQ);
        if (!tasksSnap.empty) {
          const task = { id: tasksSnap.docs[0].id, ...tasksSnap.docs[0].data() } as Task;
          taskMap[crop.id] = task;
        }

        // Count done tasks
        const doneQ = query(
          collection(db, 'tasks'),
          where('cropId', '==', crop.id),
          where('completed', '==', true)
        );
        const doneSnap = await getDocs(doneQ);
        doneCount += doneSnap.size;
      }

      setNextTasks(taskMap);
      setTotalTasksDone(doneCount);
    } catch (e) {
      console.log('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const getDaysSinceSowing = (sowingDate: string) => {
    const sowing = new Date(sowingDate);
    const today = new Date();
    const days = Math.floor((today.getTime() - sowing.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getWeekNum = (sowingDate: string) => {
    const days = getDaysSinceSowing(sowingDate);
    return Math.floor(days / 7) + 1;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#f0b84a"
        />
      }
    >
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
          <Text style={styles.statNum}>{crops.length}</Text>
          <Text style={styles.statLabel}>Active{'\n'}Crops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalTasksDone}</Text>
          <Text style={styles.statLabel}>Tasks{'\n'}Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Day{'\n'}Streak</Text>
        </View>
      </View>

      {/* Active crops list */}
      {crops.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌱 Active Crops</Text>
            <Text style={styles.sectionSub}>Pull down to refresh</Text>
          </View>

          {crops.map(crop => {
            const days = getDaysSinceSowing(crop.sowingDate);
            const week = getWeekNum(crop.sowingDate);
            const nextTask = nextTasks[crop.id];

            return (
              <View key={crop.id} style={styles.cropCard}>
                {/* Crop header */}
                <View style={styles.cropCardHeader}>
                  <Text style={styles.cropIcon}>
                    {CROP_ICONS[crop.cropType] || '🌱'}
                  </Text>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropName}>{crop.cropType}</Text>
                    <Text style={styles.cropMeta}>
                      📍 {crop.location} · Day {days} · Week {week}
                    </Text>
                  </View>
                  <View style={styles.weekBadge}>
                    <Text style={styles.weekBadgeText}>Wk {week}</Text>
                  </View>
                </View>

                {/* Next task */}
                {nextTask ? (
                  <View style={styles.nextTaskRow}>
                    <View style={[styles.taskDot,
                      { backgroundColor: TASK_COLORS[nextTask.type] || '#8a7a60' }
                    ]} />
                    <Text style={styles.nextTaskLabel}>Next: </Text>
                    <Text style={styles.nextTaskText} numberOfLines={1}>
                      {nextTask.title}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.nextTaskRow}>
                    <Text style={styles.allDoneText}>✅ All tasks complete!</Text>
                  </View>
                )}
              </View>
            );
          })}
        </>
      ) : (
        /* Empty state */
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🤖</Text>
          <Text style={styles.heroTitle}>Start Your First{'\n'}Crop Calendar</Text>
          <Text style={styles.heroSub}>
            AI generates a personalized{'\n'}20-week farming plan for you
          </Text>
        </View>
      )}

      {/* Tips section */}
      <Text style={styles.tipsTitle}>💡 Farming Tips</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 13, color: '#6a6050', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '700', color: '#f0b84a' },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2d7a4a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#111a14', borderRadius: 14,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  statNum: { fontSize: 28, fontWeight: '700', color: '#f0b84a' },
  statLabel: {
    fontSize: 10, color: '#6a6050',
    marginTop: 4, textAlign: 'center', lineHeight: 14,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#8a7a60', letterSpacing: 0.5 },
  sectionSub: { fontSize: 10, color: '#3a3025' },

  // Crop card
  cropCard: {
    backgroundColor: '#111a14',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cropIcon: { fontSize: 32 },
  cropInfo: { flex: 1 },
  cropName: { fontSize: 16, fontWeight: '700', color: '#eee8d8', marginBottom: 2 },
  cropMeta: { fontSize: 11, color: '#6a6050' },
  weekBadge: {
    backgroundColor: 'rgba(212,168,67,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
  },
  weekBadgeText: { fontSize: 11, fontWeight: '700', color: '#f0b84a' },

  // Next task
  nextTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  taskDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  nextTaskLabel: { fontSize: 11, color: '#6a6050', fontWeight: '700' },
  nextTaskText: { fontSize: 12, color: '#b0a080', flex: 1 },
  allDoneText: { fontSize: 12, color: '#3db870', fontWeight: '600' },

  // Hero card (empty state)
  heroCard: {
    backgroundColor: '#111a14',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.15)',
    alignItems: 'center', marginBottom: 24,
  },
  heroEmoji: { fontSize: 44, marginBottom: 12 },
  heroTitle: {
    fontSize: 22, fontWeight: '700', color: '#eee8d8',
    textAlign: 'center', marginBottom: 8, lineHeight: 30,
  },
  heroSub: {
    fontSize: 13, color: '#6a6050',
    textAlign: 'center', marginBottom: 20, lineHeight: 20,
  },

  // Tips
  tipsTitle: {
    fontSize: 14, fontWeight: '700', color: '#8a7a60',
    marginBottom: 12, marginTop: 8, letterSpacing: 0.5,
  },
  tipCard: {
    backgroundColor: '#111a14', borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  tipText: { fontSize: 13, color: '#8a7a60', lineHeight: 20 },
});