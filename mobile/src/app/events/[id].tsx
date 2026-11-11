import { useCallback, useState } from "react";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { RegistrationActions } from "@/components/RegistrationActions";
import { api } from "@/lib/api";
import { formatDate, formatEventFormat, getEventStatus } from "@/lib/format";
import type { EventDetail } from "@/lib/types";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestVersion = reloadKey;

      async function load() {
        if (!id) {
          setError("Thiếu mã sự kiện.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        try {
          const data = await api.event(id);
          if (active && requestVersion === reloadKey) setEvent(data);
        } catch (caught) {
          if (active) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Không thể tải chi tiết sự kiện.",
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      void load();
      return () => {
        active = false;
      };
    }, [id, reloadKey]),
  );

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <Stack.Screen options={{ title: event?.title ?? "Chi tiết sự kiện" }} />
      {loading ? (
        <LoadingState label="Đang tải chi tiết sự kiện…" />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : event ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>THÔNG TIN SỰ KIỆN</Text>
          <Text style={styles.title}>{event.title}</Text>
          {getEventStatus(event) && (
            <Text style={[styles.statusBadge, styles[getEventStatus(event)!]]}>
              {getEventStatus(event) === "expired"
                ? "Đã hết hạn"
                : getEventStatus(event) === "ongoing"
                  ? "Đang diễn ra"
                  : "Mới"}
            </Text>
          )}

          <View style={styles.metaGroup}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Bắt đầu</Text>
              <Text style={styles.metaValue}>{formatDate(event.startsAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Kết thúc</Text>
              <Text style={styles.metaValue}>{formatDate(event.endsAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Địa điểm</Text>
              <Text style={styles.metaValue}>{event.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Hình thức</Text>
              <Text style={styles.metaValue}>
                {formatEventFormat(event.format)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Thời lượng</Text>
              <Text style={styles.metaValue}>
                {formatDuration(event.startsAt, event.endsAt)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Chỗ còn lại</Text>
              <View style={styles.slotRow}>
                <Text style={styles.metaValue}>
                  {`Còn ${event.remainingSlots}/${event.capacity} chỗ`}
                  {event.remainingSlots <= 0 ? " · Đã đủ chỗ" : ""}
                </Text>
                {getEventStatus(event) && (
                  <Text
                    style={[styles.statusBadge, styles[getEventStatus(event)!]]}
                  >
                    {getEventStatus(event) === "expired"
                      ? "Đã hết hạn"
                      : getEventStatus(event) === "ongoing"
                        ? "Đang diễn ra"
                        : "Mới"}
                  </Text>
                )}
              </View>
            </View>
            <View>
              {event.registrationDeadline && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Hạn đăng ký</Text>
                  <Text style={styles.metaValue}>
                    {formatDate(event.registrationDeadline)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.registration}>
            <RegistrationActions
              key={event.id}
              eventId={event.id}
              registration={event.registration}
              expired={new Date(event.endsAt).getTime() <= Date.now()}
              full={event.remainingSlots <= 0}
              registrationClosed={
                !!event.registrationDeadline &&
                new Date(event.registrationDeadline).getTime() <= Date.now()
              }
              onChange={(registration) =>
                setEvent((current) =>
                  current ? { ...current, registration } : current,
                )
              }
            />
            {event.registration && !event.registration.checkedInAt && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/check-in", params: { eventId: event.id } })}
                style={styles.checkInButton}
              >
                <Text style={styles.checkInButtonText}>Quét QR để check-in</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{event.description}</Text>

          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Công cụ học tập</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở ghi chú và tóm tắt AI"
              style={({ pressed }) => [
                styles.noteCard,
                pressed && styles.noteCardPressed,
              ]}
              onPress={() => router.push(`/notes/${event.id}`)}
            >
              <View style={styles.noteCardContent}>
                <View style={styles.iconBadge}>
                  <Text style={styles.noteIcon}>✨</Text>
                </View>
                <View style={styles.noteInfo}>
                  <Text style={styles.noteCardTitle}>Ghi chú & Tóm tắt AI</Text>
                  <Text style={styles.noteCardSubtitle}>
                    Lưu nội dung bài giảng và tạo tóm tắt thông minh với Gemini AI
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function formatDuration(startsAt: string, endsAt: string) {
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000,
    ),
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (
    [hours ? `${hours} giờ` : "", rest ? `${rest} phút` : ""]
      .filter(Boolean)
      .join(" ") || "Dưới 1 phút"
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  registration: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 20,
    padding: 18,
  },
  checkInButton: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 10, marginTop: 12, padding: 12 },
  checkInButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  eyebrow: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    color: "#172554",
    flexShrink: 1,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
    marginTop: 6,
  },
  slotRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 99,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 8,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  expired: { backgroundColor: "#e2e8f0", color: "#475569" },
  ongoing: { backgroundColor: "#dcfce7", color: "#15803d" },
  new: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  metaGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    gap: 18,
    marginTop: 24,
    padding: 18,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  metaItem: { gap: 4 },
  metaLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  metaValue: { color: "#0f172a", fontSize: 16, lineHeight: 23 },
  sectionTitle: {
    color: "#172554",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 28,
  },
  description: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 10,
  },
  actionsContainer: {
    marginTop: 12,
  },
  noteCard: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  noteCardPressed: {
    backgroundColor: "#dbeafe",
  },
  noteCardContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  noteIcon: {
    fontSize: 22,
  },
  noteInfo: {
    flex: 1,
    gap: 4,
  },
  noteCardTitle: {
    color: "#1e3a8a",
    fontSize: 16,
    fontWeight: "700",
  },
  noteCardSubtitle: {
    color: "#3b82f6",
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    color: "#2563eb",
    fontSize: 24,
    fontWeight: "600",
  },
});
