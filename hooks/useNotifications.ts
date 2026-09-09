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
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });
  console.log(`✅ Notification scheduled in ${secondsFromNow} seconds`);
}

// Schedule daily 6 AM notification
export async function scheduleDailyReminder(taskTitle: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌾 Annadata — Today\'s Farm Task',
      body: taskTitle,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 6,
      minute: 0,
    },
  });
  console.log('✅ Daily 6 AM reminder scheduled');
}