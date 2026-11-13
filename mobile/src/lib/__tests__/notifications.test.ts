/* eslint-disable import/first */
/**
 * Tests for mobile/src/lib/notifications.ts
 *
 * No test runner is configured in package.json. Run these with Jest or Vitest
 * after adding the appropriate dev dependency and config, e.g.:
 *
 *   npm install --save-dev jest @types/jest ts-jest
 *   # then: npx jest src/lib/__tests__/notifications.test.ts
 *
 * The tests below are written in Jest/Vitest style and use manual mocks for
 * expo-notifications and @react-native-async-storage/async-storage.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSchedule = jest.fn();
const mockCancel = jest.fn();
const mockGetPerms = jest.fn();
const mockRequestPerms = jest.fn();

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: () => mockGetPerms(),
  requestPermissionsAsync: () => mockRequestPerms(),
  scheduleNotificationAsync: (req: unknown) => mockSchedule(req),
  cancelScheduledNotificationAsync: (id: string) => mockCancel(id),
}));

const store: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => store[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => { store[key] = value; }),
}));

// ---------------------------------------------------------------------------
// Import SUT after mocks are set up
// ---------------------------------------------------------------------------

import {
  requestNotificationPermission,
  scheduleEventReminder,
  cancelEventReminder,
  saveNotificationId,
  getNotificationId,
  removeNotificationId,
} from '../notifications';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoInFuture(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function isoInPast(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toISOString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the in-memory store
  for (const k of Object.keys(store)) delete store[k];
});

describe('requestNotificationPermission', () => {
  it('returns true when already granted', async () => {
    mockGetPerms.mockResolvedValue({ status: 'granted' });
    expect(await requestNotificationPermission()).toBe(true);
    expect(mockRequestPerms).not.toHaveBeenCalled();
  });

  it('requests permission and returns true when granted after request', async () => {
    mockGetPerms.mockResolvedValue({ status: 'undetermined' });
    mockRequestPerms.mockResolvedValue({ status: 'granted' });
    expect(await requestNotificationPermission()).toBe(true);
  });

  it('returns false when permission denied', async () => {
    mockGetPerms.mockResolvedValue({ status: 'undetermined' });
    mockRequestPerms.mockResolvedValue({ status: 'denied' });
    expect(await requestNotificationPermission()).toBe(false);
  });

  it('returns false on unexpected error', async () => {
    mockGetPerms.mockRejectedValue(new Error('OS error'));
    expect(await requestNotificationPermission()).toBe(false);
  });
});

describe('scheduleEventReminder – remind time calculation', () => {
  it('schedules notification 30 min before startsAt when in future', async () => {
    mockGetPerms.mockResolvedValue({ status: 'granted' });
    mockSchedule.mockResolvedValue('notif-abc');

    const startsAt = isoInFuture(90 * 60 * 1000); // starts 90 min from now → remind in 60 min
    const id = await scheduleEventReminder('evt-1', 'Test Event', startsAt);

    expect(id).toBe('notif-abc');
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    const call = mockSchedule.mock.calls[0][0] as { trigger: { date: Date } };
    const remindDate = call.trigger.date;
    const expectedRemind = new Date(new Date(startsAt).getTime() - 30 * 60 * 1000);
    // Allow ±1 second tolerance
    expect(Math.abs(remindDate.getTime() - expectedRemind.getTime())).toBeLessThan(1000);
  });

  it('returns null and skips scheduling when remind time is in the past', async () => {
    mockGetPerms.mockResolvedValue({ status: 'granted' });

    // Event starts 10 min from now → remind time = now - 20 min (past)
    const startsAt = isoInFuture(10 * 60 * 1000);
    const id = await scheduleEventReminder('evt-2', 'Past Event', startsAt);

    expect(id).toBeNull();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('returns null and skips scheduling when event is already in the past', async () => {
    const startsAt = isoInPast(60 * 60 * 1000); // started an hour ago
    const id = await scheduleEventReminder('evt-3', 'Old Event', startsAt);

    expect(id).toBeNull();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('returns null when permission is denied', async () => {
    mockGetPerms.mockResolvedValue({ status: 'undetermined' });
    mockRequestPerms.mockResolvedValue({ status: 'denied' });

    const startsAt = isoInFuture(90 * 60 * 1000);
    const id = await scheduleEventReminder('evt-4', 'Denied Event', startsAt);

    expect(id).toBeNull();
    expect(mockSchedule).not.toHaveBeenCalled();
  });
});

describe('AsyncStorage mapping – save / get / remove', () => {
  it('saves and retrieves a notificationId', async () => {
    await saveNotificationId('evt-10', 'notif-xyz');
    const retrieved = await getNotificationId('evt-10');
    expect(retrieved).toBe('notif-xyz');
  });

  it('returns null for unknown eventId', async () => {
    expect(await getNotificationId('unknown-evt')).toBeNull();
  });

  it('removes a notificationId', async () => {
    await saveNotificationId('evt-11', 'notif-111');
    await removeNotificationId('evt-11');
    expect(await getNotificationId('evt-11')).toBeNull();
  });

  it('preserves other entries when removing one', async () => {
    await saveNotificationId('evt-a', 'notif-aaa');
    await saveNotificationId('evt-b', 'notif-bbb');
    await removeNotificationId('evt-a');
    expect(await getNotificationId('evt-b')).toBe('notif-bbb');
  });

  it('overwrites an existing entry on save', async () => {
    await saveNotificationId('evt-c', 'notif-old');
    await saveNotificationId('evt-c', 'notif-new');
    expect(await getNotificationId('evt-c')).toBe('notif-new');
  });
});

describe('cancelEventReminder', () => {
  it('cancels the scheduled notification and removes the mapping', async () => {
    // Pre-seed the mapping
    await saveNotificationId('evt-20', 'notif-cancel-me');
    mockCancel.mockResolvedValue(undefined);

    await cancelEventReminder('evt-20');

    expect(mockCancel).toHaveBeenCalledWith('notif-cancel-me');
    expect(await getNotificationId('evt-20')).toBeNull();
  });

  it('is a no-op when no mapping exists', async () => {
    await cancelEventReminder('evt-99');
    expect(mockCancel).not.toHaveBeenCalled();
  });
});
