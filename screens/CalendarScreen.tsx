import {
  View, Text, StyleSheet, FlatList,
  ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import {
  collection, query, where, getDocs,
  doc, updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASK_META: Record<string, { icon: string; color: string; bg: string }> = {
  water:     { icon: '💧', color: '#4fc3f7', bg: 'rgba(79,195,247,0.1)' },
  fertilize: { icon: '🌿', color: '#81c784', bg: 'rgba(129,199,132,0.1)' },
  pest:      { icon: '🐛', color: '#e57373', bg: 'rgba(229,115,115,0.1)' },
  harvest:   { icon: '🌾', color: '#f0b84a', bg: 'rgba(240,184,74,0.1)' },
  prepare:   { icon: '🚜', color: '#ce93d8', bg: 'rgba(206,147,216,0.1)' },
  general:   { icon: '👨‍🌾', color: '#8a7a60', bg: 'rgba(138,122,96,0.1)' },
};

type Task = {
  id: string;
  weekId: string;
  cropId: string;
  type: string;
  title: string;
  desc: string;
  translatedTask: string;
  completed: boolean;
};

type Week = {
  id: string;
  cropId: string;
  weekNum: number;
  startDate: string;
  endDate: string;
  tasks: Task[];
};

type Crop = {
  id: string;
  cropType: string;
  sowingDate: string;
  location: string;
  language: string;
  tasksDone: number;
};

export default function CalendarScreen() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingWeeks, setLoadingWeeks] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const user = auth.currentUser;

  const getTotalProgress = () => {
    const allTasks = weeks.flatMap(w => w.tasks);
    const done = allTasks.filter(t => t.completed).length;
    return {
      done,
      total: allTasks.length,
      pct: allTasks.length > 0 ? Math.round(done / allTasks.length * 100) : 0
    };
  };

  const progress = getTotalProgress();

  // Animate progress bar whenever progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress.pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress.pct]);

  // Fetch crops on mount
  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'crops'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const cropList: Crop[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Crop));
      setCrops(cropList);
      if (cropList.length > 0) {
        selectCrop(cropList[0]);
      }
    } catch (e) {
      console.log('Error fetching crops:', e);
    }
    setLoading(false);
  };

  const selectCrop = async (crop: Crop) => {
    setSelectedCrop(crop);
    setSelectedWeek(0);
    setLoadingWeeks(true);
    try {
      // Fetch weeks
      const weeksQ = query(
        collection(db, 'calendarWeeks'),
        where('cropId', '==', crop.id)
      );
      const weeksSnap = await getDocs(weeksQ);
      const weekList: Week[] = weeksSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Week, 'id' | 'tasks'>),
        tasks: [] as Task[],
      }));

      weekList.sort((a, b) => a.weekNum - b.weekNum);

      // Fetch tasks for each week with AsyncStorage offline support
      for (const week of weekList) {
        const tasksQ = query(
          collection(db, 'tasks'),
          where('weekId', '==', week.id)
        );
        const tasksSnap = await getDocs(tasksQ);

        week.tasks = await Promise.all(tasksSnap.docs.map(async d => {
          const task = { id: d.id, ...d.data() } as Task;
          // Check AsyncStorage for offline completed state
          try {
            const cached = await AsyncStorage.getItem(`task_${task.id}`);
            if (cached !== null) {
              task.completed = JSON.parse(cached);
            }
          } catch (e) {}
          return task;
        }));
      }

      setWeeks(weekList);
    } catch (e) {
      console.log('Error fetching weeks:', e);
    }
    setLoadingWeeks(false);
  };

  const toggleTask = async (task: Task) => {
    const newCompleted = !task.completed;

    // 1. Update local state immediately (instant UI)
    setWeeks(prev => prev.map(w => ({
      ...w,
      tasks: w.tasks.map(t =>
        t.id === task.id ? { ...t, completed: newCompleted } : t
      )
    })));

    // 2. Save to AsyncStorage for offline
    try {
      await AsyncStorage.setItem(
        `task_${task.id}`,
        JSON.stringify(newCompleted)
      );
    } catch (e) {
      console.log('AsyncStorage error:', e);
    }

    // 3. Update Firebase
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        completed: newCompleted,
        completedAt: newCompleted ? new Date().toISOString() : null,
      });
    } catch (e) {
      // Offline — AsyncStorage already saved it
      console.log('Firebase update failed, saved offline');
    }
  };

  const getCropIcon = (cropType: string) => {
    const icons: Record<string, string> = {
      Rice: '🌾', Wheat: '🌾', Maize: '🌽',
      Onion: '🧅', Tomato: '🍅', Sugarcane: '🌿',
      Cotton: '☁️', Groundnut: '🥜', Ragi: '🌾', Jowar: '🌾',
    };
    return icons[cropType] || '🌱';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#f0b84a" size="large" />
        <Text style={styles.loadingText}>Loading your crops...</Text>
      </View>
    );
  }

  // ─── EMPTY STATE ───
  if (crops.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🌱</Text>
        <Text style={styles.emptyTitle}>No crops yet</Text>
        <Text style={styles.emptySub}>
          Go to Home → Add New Crop{'\n'}to generate your first calendar
        </Text>
      </View>
    );
  }

  const currentWeekData = weeks[selectedWeek];

  return (
    <View style={styles.container}>

      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 My Calendars</Text>
      </View>

      {/* ─── CROP SELECTOR ─── */}
      {crops.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cropScroll}
        >
          {crops.map(crop => (
            <TouchableOpacity
              key={crop.id}
              style={[
                styles.cropChip,
                selectedCrop?.id === crop.id && styles.cropChipActive
              ]}
              onPress={() => selectCrop(crop)}
            >
              <Text style={styles.cropChipText}>
                {getCropIcon(crop.cropType)} {crop.cropType}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ─── CROP HEADER CARD ─── */}
      {selectedCrop && (
        <View style={styles.cropHeader}>
          <View style={styles.cropHeaderLeft}>
            <Text style={styles.cropHeaderIcon}>
              {getCropIcon(selectedCrop.cropType)}
            </Text>
            <View>
              <Text style={styles.cropHeaderName}>
                {selectedCrop.cropType} Calendar
              </Text>
              <Text style={styles.cropHeaderMeta}>
                📍 {selectedCrop.location} · Sown {formatDate(selectedCrop.sowingDate)}
              </Text>
            </View>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPct}>{progress.pct}%</Text>
          </View>
        </View>
      )}

      {/* ─── ANIMATED PROGRESS BAR ─── */}
      <View style={styles.progressBarWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {
            width: progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            })
          }]} />
        </View>
        <Text style={styles.progressLabel}>
          {progress.done}/{progress.total} tasks done
        </Text>
      </View>

      {/* ─── WEEK SELECTOR ─── */}
      {loadingWeeks ? (
        <ActivityIndicator color="#f0b84a" style={{ marginTop: 20 }} />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekScroll}
          >
            {weeks.map((week, idx) => {
              const allDone = week.tasks.length > 0 &&
                week.tasks.every(t => t.completed);
              return (
                <TouchableOpacity
                  key={week.id}
                  style={[
                    styles.weekTab,
                    selectedWeek === idx && styles.weekTabActive,
                    allDone && styles.weekTabDone,
                  ]}
                  onPress={() => setSelectedWeek(idx)}
                >
                  <Text style={[
                    styles.weekTabText,
                    selectedWeek === idx && styles.weekTabTextActive,
                  ]}>
                    {allDone ? '✓' : `W${week.weekNum}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ─── WEEK HEADER ─── */}
          {currentWeekData && (
            <View style={styles.weekHeader}>
              <Text style={styles.weekHeaderTitle}>
                Week {currentWeekData.weekNum}
              </Text>
              <Text style={styles.weekHeaderDates}>
                {formatDate(currentWeekData.startDate)} –{' '}
                {formatDate(currentWeekData.endDate)}
              </Text>
            </View>
          )}

          {/* ─── TASK CARDS ─── */}
          <FlatList
            data={currentWeekData?.tasks || []}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptySub}>No tasks for this week</Text>
              </View>
            }
            renderItem={({ item: task }) => {
              const meta = TASK_META[task.type] || TASK_META.general;
              return (
                <View style={[
                  styles.taskCard,
                  { borderLeftColor: meta.color },
                  task.completed && styles.taskCardDone,
                ]}>
                  <View style={styles.taskTop}>
                    <View style={[styles.taskIconWrap, { backgroundColor: meta.bg }]}>
                      <Text style={styles.taskIcon}>{meta.icon}</Text>
                    </View>
                    <View style={styles.taskBody}>
                      <Text style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleDone
                      ]}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskDesc}>{task.desc}</Text>
                      {task.translatedTask && task.translatedTask !== task.title && (
                        <Text style={styles.taskTranslated}>
                          🌐 {task.translatedTask}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.taskFooter}>
                    <View style={[styles.taskTag, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.taskTagText, { color: meta.color }]}>
                        {task.type.toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.doneBtn,
                        task.completed && styles.doneBtnActive
                      ]}
                      onPress={() => toggleTask(task)}
                    >
                      <Text style={[
                        styles.doneBtnText,
                        task.completed && styles.doneBtnTextActive
                      ]}>
                        {task.completed ? '✓ Done' : 'Mark Done'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f09',
  },
  centered: {
    flex: 1,
    backgroundColor: '#080f09',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#6a6050',
    marginTop: 12,
    fontSize: 14,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eee8d8',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#4a4030',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eee8d8',
  },
  cropScroll: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 56,
  },
  cropChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 8,
  },
  cropChipActive: {
    backgroundColor: '#2d7a4a',
    borderColor: '#2d7a4a',
  },
  cropChipText: {
    color: '#b0a080',
    fontSize: 13,
    fontWeight: '600',
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#111a14',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.15)',
  },
  cropHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cropHeaderIcon: { fontSize: 32 },
  cropHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#eee8d8',
    marginBottom: 2,
  },
  cropHeaderMeta: {
    fontSize: 11,
    color: '#6a6050',
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,168,67,0.1)',
    borderWidth: 2,
    borderColor: '#f0b84a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f0b84a',
  },
  progressBarWrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d7a4a',
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 10,
    color: '#6a6050',
    fontWeight: '600',
  },
  weekScroll: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 56,
  },
  weekTab: {
    width: 40,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  weekTabActive: {
    backgroundColor: '#2d7a4a',
    borderColor: '#2d7a4a',
  },
  weekTabDone: {
    borderColor: '#f0b84a',
    backgroundColor: 'rgba(212,168,67,0.1)',
  },
  weekTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a4030',
  },
  weekTabTextActive: {
    color: '#fff',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  weekHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b0a080',
  },
  weekHeaderDates: {
    fontSize: 11,
    color: '#4a4030',
    fontFamily: 'monospace',
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#111a14',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
  },
  taskCardDone: {
    opacity: 0.5,
  },
  taskTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  taskIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskIcon: { fontSize: 18 },
  taskBody: { flex: 1 },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#eee8d8',
    marginBottom: 4,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#4a4030',
  },
  taskDesc: {
    fontSize: 12,
    color: '#6a6050',
    lineHeight: 18,
  },
  taskTranslated: {
    fontSize: 12,
    color: '#8a7a60',
    marginTop: 6,
    fontStyle: 'italic',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
  },
  taskTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taskTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  doneBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  doneBtnActive: {
    backgroundColor: '#2d7a4a',
    borderColor: '#2d7a4a',
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6a6050',
  },
  doneBtnTextActive: {
    color: '#fff',
  },
});