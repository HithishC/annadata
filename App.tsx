import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, Text, ToastAndroid, Alert, Platform, TouchableOpacity } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import CameraScreen from './screens/CameraScreen';
import ProfileScreen from './screens/ProfileScreen';
import NewCropScreen from './screens/NewCropScreen';
import LoadingScreen from './screens/LoadingScreen';
import { generateCalendar, CropRequest } from './api/calendar';
import { registerForPushNotifications, scheduleLocalNotif } from './hooks/useNotifications';
import * as Notifications from 'expo-notifications';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function showToast(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.LONG);
  } else {
    Alert.alert(msg);
  }
}

function TabNavigator({ user }: { user: User }) {
  const [showNewCrop, setShowNewCrop] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isCallingAPI = useRef(false);

  const handleGenerate = async (data: CropRequest) => {
    if (isCallingAPI.current) return;
    isCallingAPI.current = true;

    console.log('🌾 handleGenerate called with:', JSON.stringify(data));
    setShowNewCrop(false);
    setIsGenerating(true);

    try {
      console.log('🤖 Calling Groq AI...');
      const calendar = await generateCalendar(data);
      console.log('✅ Calendar received, weeks:', calendar.length);

      console.log('💾 Saving crop to Firestore...');
      const cropRef = await addDoc(collection(db, 'crops'), {
        userId: user.uid,
        cropType: data.cropType,
        sowingDate: data.sowingDate,
        location: data.location,
        variety: data.variety,
        language: data.language,
        tasksDone: 0,
        createdAt: serverTimestamp(),
      });
      console.log('✅ Crop saved, id:', cropRef.id);

      console.log('💾 Saving weeks and tasks...');
      for (const week of calendar) {
        const weekRef = await addDoc(collection(db, 'calendarWeeks'), {
          cropId: cropRef.id,
          userId: user.uid,
          weekNum: week.weekNum,
          startDate: week.startDate,
          endDate: week.endDate,
        });

        for (const task of week.tasks) {
          await addDoc(collection(db, 'tasks'), {
            weekId: weekRef.id,
            cropId: cropRef.id,
            userId: user.uid,
            type: task.type,
            title: task.title,
            desc: task.desc,
            translatedTask: task.translatedTask || task.title,
            completed: false,
            completedAt: null,
          });
        }
      }

      console.log('✅ All weeks and tasks saved!');

      // Schedule notification for first task
      try {
        const firstTask = calendar[0]?.tasks[0];
        if (firstTask) {
          await scheduleLocalNotif(
            '🌾 Annadata — Calendar Ready!',
            `Your ${data.cropType} calendar is ready. Week 1: ${firstTask.title}`,
            5
          );
        }
      } catch (e) {}

      setIsGenerating(false);
      isCallingAPI.current = false;
      showToast('✅ Calendar generated successfully!');

    } catch (error: any) {
      console.log('❌ Error type:', error?.code);
      console.log('❌ Error message:', error?.message);
      setIsGenerating(false);
      isCallingAPI.current = false;
      Alert.alert(
        'Error',
        error?.message?.includes('timeout')
          ? 'AI is taking too long. Please try again.'
          : error?.message || 'Something went wrong. Please try again.'
      );
    }
  };

  if (isGenerating) return <LoadingScreen />;

  if (showNewCrop) {
    return (
      <NewCropScreen
        onBack={() => setShowNewCrop(false)}
        onGenerate={handleGenerate}
      />
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d1a0f',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#f0b84a',
        tabBarInactiveTintColor: '#3a3025',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      >
        {() => (
          <View style={{ flex: 1 }}>
            <HomeScreen user={user} onAddCrop={() => setShowNewCrop(true)} />
            {/* FAB Button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                bottom: 80,
                right: 20,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#2d7a4a',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
              onPress={() => setShowNewCrop(true)}
            >
              <Text style={{ fontSize: 28, color: '#fff', lineHeight: 32 }}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: () => <Text>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarLabel: 'Camera',
          tabBarIcon: () => <Text>📷</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, []);

  // Setup notifications on first open
  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await registerForPushNotifications();
      if (granted) {
        await scheduleLocalNotif(
          '🌾 Annadata Test',
          'Notifications are working! Your daily farm reminders are set.',
          60
        );
      }
    };
    setupNotifications();
  }, []);

  // Notification listener — handle taps
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response.notification.request.content.title);
    });
    return () => sub.remove();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080f09', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#f0b84a" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main">
            {() => <TabNavigator user={user} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}