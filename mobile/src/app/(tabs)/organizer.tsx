import { useCallback, useState } from "react";
import { Redirect, router, useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { OrganizerEventItem } from "@/lib/types";
import QRCode from "react-native-qrcode-svg";
import { getCheckInQrValue } from "@/lib/check-in";

export default function OrganizerScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<OrganizerEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmHide, setConfirmHide] = useState<{ eventId: string; currentHidden: boolean } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.role !== "ORGANIZER") return;
      let active = true;
      setLoading(true);
      setError(null);
      void api
        .organizerEvents()
        .then((items) => {
          if (active) setEvents(items);
        })
        .catch((cause) => {
          if (active)
            setError(
              cause instanceof Error
                ? cause.message
                : "Không tải được danh sách sự kiện.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [user?.role, reloadKey]),
  );

  async function toggleVisibility(item: OrganizerEventItem) {
    setBusyId(item.id);
    setError(null);
    try {
      const updated = await api.setEventVisibility(item.id, !item.isHidden);
      setEvents((current) =>
        current.map((event) => (event.id === updated.id ? updated : event)),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không cập nhật được trạng thái sự kiện.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (user?.role !== "ORGANIZER") return <Redirect href="/explore" />;

  const confirmingEvent = confirmHide
    ? events.find((e) => e.id === confirmHide.eventId)
    : null;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Quản lý sự kiện</Text>
        <Text style={styles.sub}>Tạo sự kiện và theo dõi đăng ký</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.section}>Sự kiện của bạn</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/organizer/event-form")}
            style={styles.createButton}
          >
            <Text style={styles.createText}>+ Tạo sự kiện</Text>
          </Pressable>
        </View>
        {loading ? (
          <LoadingState label="Đang tải sự kiện…" />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => setReloadKey((value) => value + 1)}
          />
        ) : !events.length ? (
          <Text style={styles.empty}>Bạn chưa tạo sự kiện nào.</Text>
        ) : (
          events.map((item) => (
            <View key={item.id} style={styles.eventRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/organizer/events/[id]/stats",
                    params: { id: item.id },
                  })
                }
                style={styles.eventInfo}
              >
                <Text numberOfLines={2} style={styles.eventTitle}>
                  {item.title}
                </Text>
                <Text style={styles.slotSummary}>
                  Còn {item.remainingSlots}/{item.capacity} chỗ
                </Text>
                <Text style={styles.statsLink}>Xem thống kê</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/organizer/event-form",
                    params: { eventId: item.id },
                  })
                }
                style={styles.editButton}
              >
                <Text style={styles.editText}>Sửa</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busyId === item.id}
                onPress={() => setConfirmHide({ eventId: item.id, currentHidden: item.isHidden })}
                style={[
                  styles.visibilityButton,
                  item.isHidden && styles.showButton,
                  busyId === item.id && styles.disabled,
                ]}
              >
                <Text
                  style={[
                    styles.visibilityText,
                    item.isHidden && styles.showText,
                  ]}
                >
                  {item.isHidden ? "Hiện" : "Ẩn"}
                </Text>
              </Pressable>
              {item.qrToken && <View style={styles.qrBox}><QRCode value={getCheckInQrValue(item.id, item.qrToken)} size={88} /><Text style={styles.qrLabel}>QR check-in</Text></View>}
            </View>
          ))
        )}
      </View>
    </ScrollView>

    <ConfirmModal
      visible={confirmHide !== null}
      title={confirmingEvent?.isHidden ? "Hiện sự kiện?" : "Ẩn sự kiện?"}
      message={
        confirmingEvent?.isHidden
          ? `Sự kiện "${confirmingEvent.title}" sẽ hiển thị cho sinh viên.`
          : `Sự kiện "${confirmingEvent?.title ?? ""}" sẽ bị ẩn khỏi danh sách.`
      }
      confirmLabel={confirmingEvent?.isHidden ? "Hiện sự kiện" : "Ẩn sự kiện"}
      cancelLabel="Hủy"
      destructive={!confirmingEvent?.isHidden}
      loading={busyId === confirmHide?.eventId}
      onConfirm={() => {
        if (confirmingEvent) {
          void toggleVisibility(confirmingEvent).then(() => setConfirmHide(null));
        }
      }}
      onCancel={() => setConfirmHide(null)}
    />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  page: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heading: { color: "#172554", fontSize: 28, fontWeight: "800" },
  sub: { color: "#64748b", fontSize: 15, marginTop: 4 },
  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 16,
    gap: 14,
    borderColor: "#dbe3f0",
    borderWidth: 1,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  section: { color: "#172554", fontSize: 20, fontWeight: "800", flexShrink: 1 },
  createButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  createText: { color: "white", fontSize: 12, fontWeight: "800" },
  empty: { color: "#64748b", fontSize: 14, paddingVertical: 8 },
  eventRow: {
    alignItems: "center",
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
  },
  eventInfo: { alignItems: "flex-start", flex: 1, gap: 4, minWidth: 0 },
  eventTitle: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  slotSummary: { color: "#64748b", fontSize: 12 },
  statsLink: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  editButton: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  editText: { color: "#1d4ed8", fontSize: 12, fontWeight: "800" },
  visibilityButton: {
    backgroundColor: "#fff1f2",
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  showButton: { backgroundColor: "#ecfdf5" },
  visibilityText: { color: "#be123c", fontSize: 12, fontWeight: "800" },
  showText: { color: "#047857" },
  disabled: { opacity: 0.55 },
  qrBox: { alignItems: "center", gap: 4, marginLeft: 4 },
  qrLabel: { color: "#64748b", fontSize: 10, fontWeight: "700" },
});
