// Notifications stubbed out for Expo Go compatibility
// Will be fully enabled in production build (EAS Build)

export async function registerForPushNotifications(): Promise<boolean> {
  return false;
}

export async function scheduleLocalNotif(
  title: string,
  body: string,
  secondsFromNow: number
): Promise<void> {
  // Stubbed — works in EAS build only
}

export async function scheduleDailyReminder(
  weeks: any[],
  sowingDate: string,
  cropType: string,
  language: string
): Promise<void> {
  // Stubbed — works in EAS build only
}

export function findTodaysTask(
  weeks: any[],
  sowingDate: string
): { title: string; translatedTask: string; type: string } | null {
  if (!weeks || weeks.length === 0) return null;
  for (const week of weeks) {
    const incomplete = week.tasks?.find((t: any) => !t.completed);
    if (incomplete) return incomplete;
  }
  return null;
}