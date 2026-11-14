import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScheduledRegistration } from './types';

const NOTIFICATION_MAP_KEY = 'event_notification_map';
const DECLINED_EVENTS_KEY = 'declined_events';
const UNAVAILABLE_EVENTS_KEY = 'unavailable_events';
const CHECK_IN_BEFORE_MS = 60 * 60 * 1000;
const REMIND_BEFORE_MS = 30 * 60 * 1000;

type NotificationMap = Record<string, string[]>;

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.status === 'granted' || existing.ios?.status === 3) return true; // iOS PROVISIONAL
    const { status, granted, ios } = await Notifications.requestPermissionsAsync();
    return granted || status === 'granted' || ios?.status === 3; // iOS PROVISIONAL
  } catch {
    return false;
  }
}

async function scheduleAt(
  eventId: string,
  title: string,
  body: string,
  date: Date,
): Promise<string | null> {
  if (date.getTime() <= Date.now()) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { eventId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    return null;
  }
}

export async function scheduleRegistrationNotifications(
  eventId: string,
  eventTitle: string,
  startsAt: string,
  endsAt: string,
): Promise<string[]> {
  if (!(await requestNotificationPermission())) return [];
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const entries: [string, string, Date][] = [
    ['Check-in đã mở', `Bạn có thể check-in sự kiện "${eventTitle}" ngay bây giờ.`, new Date(start.getTime() - CHECK_IN_BEFORE_MS)],
    ['Sự kiện sắp diễn ra', `"${eventTitle}" sẽ bắt đầu sau 30 phút.`, new Date(start.getTime() - REMIND_BEFORE_MS)],
    ['Sự kiện bắt đầu', `"${eventTitle}" bắt đầu ngay bây giờ.`, start],
    ['Sự kiện kết thúc', `"${eventTitle}" đã kết thúc. Cảm ơn bạn đã tham gia!`, end],
  ];
  const ids: string[] = [];
  for (const [title, body, date] of entries) {
    const id = await scheduleAt(eventId, title, body, date);
    if (id) ids.push(id);
  }
  return ids;
}

export async function scheduleImmediateNotification(title: string, body: string, eventId: string): Promise<void> {
  if (!(await requestNotificationPermission())) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { eventId } },
      trigger: null,
    });
  } catch {
    // Keep registration actions successful if the OS rejects a notification.
  }
}

export async function cancelEventNotifications(eventId: string): Promise<void> {
  const map = await getNotificationMap();
  const ids = map[eventId] ?? [];
  await Promise.all(ids.map(async (id) => {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch { /* Already fired or removed. */ }
  }));
  delete map[eventId];
  await setNotificationMap(map);
}

async function getNotificationMap(): Promise<NotificationMap> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_MAP_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, Array.isArray(value) ? value as string[] : typeof value === 'string' ? [value] : []]));
  } catch { return {}; }
}

async function setNotificationMap(map: NotificationMap): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_MAP_KEY, JSON.stringify(map));
}

export async function saveEventNotificationIds(eventId: string, ids: string[]): Promise<void> {
  const map = await getNotificationMap();
  map[eventId] = ids;
  await setNotificationMap(map);
}

export async function getDeclinedEventIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DECLINED_EVENTS_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export async function setEventDeclined(eventId: string, declined: boolean): Promise<void> {
  const ids = new Set(await getDeclinedEventIds());
  if (declined) ids.add(eventId); else ids.delete(eventId);
  await AsyncStorage.setItem(DECLINED_EVENTS_KEY, JSON.stringify([...ids]));
}

async function getUnavailableEventIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(UNAVAILABLE_EVENTS_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export async function markEventUnavailable(eventId: string, unavailable: boolean): Promise<boolean> {
  const ids = new Set(await getUnavailableEventIds());
  const wasMarked = ids.has(eventId);
  if (unavailable) ids.add(eventId); else ids.delete(eventId);
  await AsyncStorage.setItem(UNAVAILABLE_EVENTS_KEY, JSON.stringify([...ids]));
  return wasMarked;
}

export async function reconcileEventNotifications(registrations: ScheduledRegistration[]): Promise<void> {
  const active = new Set(registrations.map((item) => item.eventId));
  const map = await getNotificationMap();
  for (const eventId of Object.keys(map)) {
    if (!active.has(eventId)) await cancelEventNotifications(eventId);
  }
  const declined = new Set(await getDeclinedEventIds());
  for (const eventId of declined) if (!active.has(eventId)) await setEventDeclined(eventId, false);
}

// Compatibility helpers retained for callers and older local data.
export async function scheduleEventReminder(eventId: string, eventTitle: string, startsAt: string): Promise<string | null> {
  const ids = await scheduleRegistrationNotifications(eventId, eventTitle, startsAt, new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString());
  return ids[0] ?? null;
}

export async function saveNotificationId(eventId: string, notificationId: string): Promise<void> {
  const map = await getNotificationMap();
  map[eventId] = [...new Set([...(map[eventId] ?? []), notificationId])];
  await setNotificationMap(map);
}

export async function getNotificationId(eventId: string): Promise<string | null> {
  return (await getNotificationMap())[eventId]?.[0] ?? null;
}

export async function removeNotificationId(eventId: string): Promise<void> {
  const map = await getNotificationMap();
  delete map[eventId];
  await setNotificationMap(map);
}

export const cancelEventReminder = cancelEventNotifications;
