import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_MAP_KEY = 'notification_map';
const REMIND_BEFORE_MS = 30 * 60 * 1000; // 30 phút

// Xin quyền — trả true nếu granted, false nếu denied (không throw)
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Lên lịch nhắc giờ 30 phút trước startsAt
// Chỉ lên lịch nếu remind time > Date.now()
// Trả về notificationId hoặc null nếu không được phép / đã qua giờ
export async function scheduleEventReminder(
  eventId: string,
  eventTitle: string,
  startsAt: string,
): Promise<string | null> {
  const remindDate = new Date(new Date(startsAt).getTime() - REMIND_BEFORE_MS);
  if (remindDate.getTime() <= Date.now()) return null;

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nhắc sự kiện sắp diễn ra',
        body: `"${eventTitle}" sẽ bắt đầu sau 30 phút.`,
        data: { eventId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: remindDate,
      },
    });
    return notificationId;
  } catch {
    return null;
  }
}

// Hủy notification đã lên lịch cho eventId
export async function cancelEventReminder(eventId: string): Promise<void> {
  const notificationId = await getNotificationId(eventId);
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore — notification may have already fired or been cancelled
  }
  await removeNotificationId(eventId);
}

// --- Mapping helpers ---

async function getMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function setMap(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_MAP_KEY, JSON.stringify(map));
}

export async function saveNotificationId(eventId: string, notificationId: string): Promise<void> {
  const map = await getMap();
  map[eventId] = notificationId;
  await setMap(map);
}

export async function getNotificationId(eventId: string): Promise<string | null> {
  const map = await getMap();
  return map[eventId] ?? null;
}

export async function removeNotificationId(eventId: string): Promise<void> {
  const map = await getMap();
  delete map[eventId];
  await setMap(map);
}
