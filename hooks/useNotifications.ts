import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// How notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request permission only
export async function registerForPushNotifications(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Annadata Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2d7a4a',
    });
  }

  console.log('Notification permission granted');
  return true;
}

// Schedule a local notification
export async function scheduleLocalNotif(
  title: string,
  body: string,
  secondsFromNow: number
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });
  console.log(`✅ Notification scheduled in ${secondsFromNow} seconds`);
}

// Find today's task based on sowing date
export function findTodaysTask(
  weeks: any[],
  sowingDate: string
): { title: string; translatedTask: string; type: string } | null {
  if (!weeks || weeks.length === 0) return null;

  const today = new Date();
  const sowing = new Date(sowingDate);
  const daysSinceSowing = Math.floor(
    (today.getTime() - sowing.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentWeekNum = Math.floor(daysSinceSowing / 7) + 1;

  // Find the matching week
  const currentWeek = weeks.find(w => w.weekNum === currentWeekNum);
  if (!currentWeek || !currentWeek.tasks || currentWeek.tasks.length === 0) {
    // Fall back to first incomplete task
    for (const week of weeks) {
      const incomplete = week.tasks?.find((t: any) => !t.completed);
      if (incomplete) return incomplete;
    }
    return null;
  }

  // Find first incomplete task in current week
  const incomplete = currentWeek.tasks.find((t: any) => !t.completed);
  return incomplete || currentWeek.tasks[0];
}

// Schedule daily 6 AM notification with today's task
export async function scheduleDailyReminder(
  weeks: any[],
  sowingDate: string,
  cropType: string,
  language: string
) {
  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const task = findTodaysTask(weeks, sowingDate);
  if (!task) {
    console.log('No task found for today');
    return;
  }

  // Use translated task if language is not English
  const taskText = language !== 'en' && task.translatedTask
    ? task.translatedTask
    : task.title;

  const LANG_PREFIXES: Record<string, string> = {
    en: 'Today',
    hi: 'आज',
    kn: 'ಇಂದು',
    te: 'ఈరోజు',
    ta: 'இன்று',
    mr: 'आज',
    ml: 'ഇന്ന്',
    bn: 'আজ',
    pa: 'ਅੱਜ',
  };

  const prefix = LANG_PREFIXES[language] || 'Today';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🌾 Annadata — ${cropType}`,
      body: `${prefix}: ${taskText}`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 6,
      minute: 0,
    },
  });

  console.log(`✅ Daily 6 AM reminder set: ${prefix}: ${taskText}`);
}