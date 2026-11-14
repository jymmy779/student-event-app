import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ScreenState";
import { RegistrationActions } from "@/components/RegistrationActions";
import { ConfirmModal } from "@/components/ConfirmModal";
import { api, ApiRequestError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  cancelEventNotifications,
  getDeclinedEventIds,
  markEventUnavailable,
  reconcileEventNotifications,
  saveEventNotificationIds,
  scheduleImmediateNotification,
  scheduleRegistrationNotifications,
  setEventDeclined,
} from "@/lib/notifications";
import type { Registration, ScheduledRegistration } from "@/lib/types";

function eventStatus(item: ScheduledRegistration) {
  if (item.checkedInAt) return "Đã check-in";
  const now = Date.now();
  if (now >= new Date(item.event.endsAt).getTime()) return "Đã kết thúc";
  if (now >= new Date(item.event.startsAt).getTime()) return "Đang diễn ra";
  return "Sắp diễn ra";
}

export default function ScheduleScreen() {
  const [registrations, setRegistrations] = useState<ScheduledRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const [attendanceConfirmation, setAttendanceConfirmation] = useState<ScheduledRegistration | null>(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const requestVersion = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const version = ++requestVersion.current;
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const items = await api.registrations();
      await reconcileEventNotifications(items);
      await Promise.all(items.map(async (item) => {
        try {
          await api.event(item.eventId);
          await markEventUnavailable(item.eventId, false);
        } catch (cause) {
          if (cause instanceof ApiRequestError && cause.code === "EVENT_NOT_FOUND") {
            await cancelEventNotifications(item.eventId);
            const alreadyNotified = await markEventUnavailable(item.eventId, true);
            if (!alreadyNotified) {
              await scheduleImmediateNotification(
                "Sự kiện đã bị ẩn hoặc hủy",
                `"${item.event.title}" hiện không còn hiển thị. Hãy kiểm tra với ban tổ chức.`,
                item.eventId,
              );
            }
          }
        }
      }));
      const declined = await getDeclinedEventIds();
      if (version === requestVersion.current) {
        setRegistrations(items);
        setDeclinedIds(declined);
      }
    } catch (caught) {
      if (version === requestVersion.current) setError(caught instanceof Error ? caught.message : "Không thể tải lịch cá nhân.");
    } finally {
      if (version === requestVersion.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestVersion.current += 1; };
  }, [load]));

  function updateRegistration(eventId: string, registration: Registration | null) {
    if (!registration) setDeclinedIds((current) => current.filter((id) => id !== eventId));
    setRegistrations((current) => registration
      ? current.map((item) => item.eventId === eventId ? { ...item, ...registration } : item)
      : current.filter((item) => item.eventId !== eventId));
  }

  function toggleAttendance(item: ScheduledRegistration) {
    setAttendanceConfirmation(item);
  }

  async function confirmAttendance() {
    const item = attendanceConfirmation;
    if (!item || attendanceBusy) return;
    const declined = declinedIds.includes(item.eventId);
    setAttendanceBusy(true);
    try {
      await setEventDeclined(item.eventId, !declined);
      if (!declined) await cancelEventNotifications(item.eventId);
      else {
        const ids = await scheduleRegistrationNotifications(
          item.eventId, item.event.title, item.event.startsAt, item.event.endsAt,
        );
        await saveEventNotificationIds(item.eventId, ids);
      }
      setDeclinedIds((current) => declined ? current.filter((id) => id !== item.eventId) : [...current, item.eventId]);
      setAttendanceConfirmation(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không cập nhật được lựa chọn tham gia.");
    } finally {
      setAttendanceBusy(false);
    }
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.heading}>Lịch của tôi</Text>
          <Text style={styles.subtitle}>Tài khoản demo · Sự kiện bạn đã đăng ký</Text>
        </View>
      </SafeAreaView>
      {loading ? <LoadingState label="Đang tải lịch của bạn…" /> : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item.eventId}
          contentContainerStyle={registrations.length ? styles.list : styles.empty}
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          ListEmptyComponent={
            <View style={styles.empty}>
              <EmptyState title="Lịch của bạn đang trống" message="Khám phá và đăng ký sự kiện để thêm vào lịch cá nhân." />
              <Pressable accessibilityRole="button" onPress={() => router.navigate("/explore")} style={styles.explore}>
                <Text style={styles.link}>Khám phá sự kiện</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.badge}>{eventStatus(item)}</Text>
              <Pressable accessibilityRole="button" onPress={() => toggleAttendance(item)} style={styles.attendanceToggle}>
                <Text style={styles.attendanceToggleText}>{declinedIds.includes(item.eventId) ? "Đã đánh dấu không tham gia · Hoàn tác" : "Đánh dấu không tham gia"}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Mở thông tin chi tiết của sự kiện"
                onPress={() => router.navigate({ pathname: "/events/[id]", params: { id: item.eventId } })}
                style={({ pressed }) => [styles.detail, pressed && styles.pressed]}
              >
                <Text style={styles.title}>{item.event.title}</Text>
                <Text style={styles.meta}>Bắt đầu: {formatDate(item.event.startsAt)}</Text>
                <Text style={styles.meta}>Kết thúc: {formatDate(item.event.endsAt)}</Text>
                <Text style={styles.meta}>Địa điểm: {item.event.location}</Text>
                <Text style={styles.link}>Xem chi tiết →</Text>
              </Pressable>
              {!item.checkedInAt && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/check-in", params: { eventId: item.eventId } })}
                  style={styles.checkInButton}
                >
                  <Text style={styles.checkInText}>Quét QR check-in</Text>
                </Pressable>
              )}
              <RegistrationActions
                eventId={item.eventId}
                eventTitle={item.event.title}
                eventStartsAt={item.event.startsAt}
                eventEndsAt={item.event.endsAt}
                registration={item}
                onChange={(registration) => updateRegistration(item.eventId, registration)}
              />
            </View>
          )}
        />
      )}
      <ConfirmModal
        visible={attendanceConfirmation !== null}
        title={attendanceConfirmation && declinedIds.includes(attendanceConfirmation.eventId) ? "Tham gia sự kiện?" : "Đánh dấu không tham gia?"}
        message={attendanceConfirmation && declinedIds.includes(attendanceConfirmation.eventId)
          ? `Bỏ đánh dấu "${attendanceConfirmation.event.title}" là không tham gia?`
          : `Bạn sẽ không tham gia "${attendanceConfirmation?.event.title ?? "sự kiện này"}"? Các nhắc giờ sẽ được tắt trên thiết bị này.`}
        confirmLabel={attendanceConfirmation && declinedIds.includes(attendanceConfirmation.eventId) ? "Tham gia" : "Không tham gia"}
        cancelLabel="Để sau"
        destructive={!(attendanceConfirmation && declinedIds.includes(attendanceConfirmation.eventId))}
        loading={attendanceBusy}
        onConfirm={() => void confirmAttendance()}
        onCancel={() => setAttendanceConfirmation(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 },
  header: { backgroundColor: "#1e3a8a" },
  headerContent: { paddingHorizontal: 20, paddingVertical: 18 },
  heading: { color: "#fff", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#bfdbfe", fontSize: 14, marginTop: 6 },
  list: { padding: 16, gap: 14 },
  empty: { flexGrow: 1 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderColor: "#dbe3f0", borderWidth: 1, padding: 18, gap: 14 },
  badge: { color: "#1d4ed8", fontSize: 13, fontWeight: "700" },
  detail: { gap: 8, paddingBottom: 14, borderBottomColor: "#e2e8f0", borderBottomWidth: 1 },
  title: { color: "#172554", fontSize: 18, fontWeight: "700" },
  meta: { color: "#475569", fontSize: 14, lineHeight: 21 },
  link: { color: "#1d4ed8", fontSize: 15, fontWeight: "600" },
  explore: { minHeight: 48, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  pressed: { opacity: 0.7 },
  checkInButton: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 10, padding: 12 },
  checkInText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  attendanceToggle: { alignSelf: "flex-start", paddingVertical: 4 },
  attendanceToggleText: { color: "#b45309", fontSize: 13, fontWeight: "700" },
});
