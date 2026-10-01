import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export default function EventDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestVersion = reloadKey;
      async function load() {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
          const data = await api.getEvent(id);
          if (active && requestVersion === reloadKey) {
            setEvent(data);
          }
        } catch (caught) {
          if (active) setError(caught instanceof Error ? caught.message : "Không thể tải chi tiết sự kiện.");
        } finally {
          if (active) setLoading(false);
        }
      }
      void load();
      return () => {
        active = false;
      };
    }, [id, reloadKey])
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingState label="Đang tải chi tiết sự kiện…" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.screen}>
        <ErrorState message={error ?? "Không tìm thấy sự kiện."} onRetry={() => setReloadKey((k) => k + 1)} />
      </View>
    );
  }

  const now = new Date();
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);

  const isPast = endsAt.getTime() < now.getTime();
  const isOngoing = startsAt.getTime() <= now.getTime() && endsAt.getTime() >= now.getTime();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      style={styles.screen}
    >
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          {isPast ? (
            <View style={[styles.badge, styles.badgeEnded]}>
              <Text style={styles.badgeTextEnded}>Đã kết thúc</Text>
            </View>
          ) : isOngoing ? (
            <View style={[styles.badge, styles.badgeOngoing]}>
              <Text style={styles.badgeTextOngoing}>Đang diễn ra</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeUpcoming]}>
              <Text style={styles.badgeTextUpcoming}>Sắp diễn ra</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <View style={styles.metaTextGroup}>
              <Text style={styles.metaLabel}>Thời gian bắt đầu</Text>
              <Text style={styles.metaValue}>{formatDate(event.startsAt)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🏁</Text>
            <View style={styles.metaTextGroup}>
              <Text style={styles.metaLabel}>Thời gian kết thúc</Text>
              <Text style={styles.metaValue}>{formatDate(event.endsAt)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <View style={styles.metaTextGroup}>
              <Text style={styles.metaLabel}>Địa điểm tổ chức</Text>
              <Text style={styles.metaValue}>{event.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeading}>Mô tả sự kiện</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>

      {/* Khối gợi ý ghi chú và tóm tắt AI dành cho sự kiện đã kết thúc */}
      <View style={styles.notesCalloutCard}>
        <View style={styles.calloutHeader}>
          <Text style={styles.calloutIcon}>✨</Text>
          <View style={styles.calloutHeaderText}>
            <Text style={styles.calloutTitle}>Ghi chú & Tóm tắt AI</Text>
            <Text style={styles.calloutSub}>
              {isPast
                ? "Sự kiện đã kết thúc. Bạn có thể ghi chép nội dung đã học và sử dụng AI để tóm tắt các điểm chính."
                : "Ghi chép nhanh các điểm lưu ý hoặc nội dung thảo luận trong sự kiện."}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/notes/[eventId]",
              params: { eventId: event.id, eventTitle: event.title },
            })
          }
          style={({ pressed }) => [styles.notesButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.notesButtonText}>📝 Mở Ghi chú & Tóm tắt AI</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f5f7fb",
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    padding: 20,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeEnded: {
    backgroundColor: "#fef3c7",
  },
  badgeOngoing: {
    backgroundColor: "#dcfce7",
  },
  badgeUpcoming: {
    backgroundColor: "#dbeafe",
  },
  badgeTextEnded: {
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextOngoing: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextUpcoming: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#172554",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  metaSection: {
    marginTop: 18,
    gap: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  metaIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  metaTextGroup: {
    flex: 1,
  },
  metaLabel: {
    color: "#64748b",
    fontSize: 12,
  },
  metaValue: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    backgroundColor: "#f1f5f9",
    height: 1,
    marginVertical: 18,
  },
  sectionHeading: {
    color: "#172554",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  notesCalloutCard: {
    backgroundColor: "#f5f3ff",
    borderColor: "#e0e7ff",
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  calloutHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  calloutIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  calloutHeaderText: {
    flex: 1,
  },
  calloutTitle: {
    color: "#4338ca",
    fontSize: 16,
    fontWeight: "700",
  },
  calloutSub: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  notesButton: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notesButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
