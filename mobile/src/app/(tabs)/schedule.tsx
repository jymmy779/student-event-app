import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestVersion = reloadKey;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await api.events();
          if (active && requestVersion === reloadKey) {
            setEvents(data);
          }
        } catch (caught) {
          if (active) setError(caught instanceof Error ? caught.message : "Không thể tải lịch sự kiện.");
        } finally {
          if (active) setLoading(false);
        }
      }
      void load();
      return () => {
        active = false;
      };
    }, [reloadKey])
  );

  const now = new Date();
  // Lọc các sự kiện đã kết thúc để viết ghi chú và tóm tắt AI
  const pastEvents = events.filter((e) => new Date(e.endsAt).getTime() < now.getTime());

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>MY SCHEDULE</Text>
          <Text style={styles.heading}>Lịch của tôi</Text>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Đang tải sự kiện…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={pastEvents}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerTitle}>💡 Ghi chú & Tóm tắt sự kiện</Text>
                <Text style={styles.infoBannerText}>
                  Dưới đây là các sự kiện đã kết thúc trong hệ thống. Bạn có thể mở để ghi chú nội dung và nhận tóm tắt từ AI.
                </Text>
              </View>

              <Text style={styles.sectionTitle}>
                Sự kiện đã kết thúc ({pastEvents.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="Chưa có sự kiện đã kết thúc"
              message="Các sự kiện sau khi kết thúc sẽ hiển thị tại đây để bạn ghi chép và tóm tắt AI."
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.badgeEnded}>
                  <Text style={styles.badgeEndedText}>Đã kết thúc</Text>
                </View>
              </View>

              <Text style={styles.meta}>📅 {formatDate(item.startsAt)}</Text>
              <Text style={styles.meta}>📍 {item.location}</Text>
              <Text numberOfLines={2} style={styles.description}>
                {item.description}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/notes/[eventId]",
                      params: { eventId: item.id, eventTitle: item.title },
                    })
                  }
                  style={({ pressed }) => [styles.noteBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.noteBtnText}>📝 Ghi chú & Tóm tắt AI</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.id } })}
                  style={({ pressed }) => [styles.detailBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.detailBtnText}>Chi tiết</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 },
  header: { backgroundColor: "#1e3a8a" },
  headerContent: { paddingHorizontal: 20, paddingVertical: 18 },
  eyebrow: { color: "#bfdbfe", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  heading: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  list: { padding: 16, gap: 14 },
  headerSection: { marginBottom: 8 },
  infoBanner: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoBannerTitle: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoBannerText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: "#172554",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    padding: 18,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    color: "#172554",
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  badgeEnded: {
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeEndedText: {
    color: "#b45309",
    fontSize: 11,
    fontWeight: "700",
  },
  meta: {
    color: "#64748b",
    fontSize: 13,
  },
  description: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    alignItems: "center",
  },
  noteBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  noteBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  detailBtn: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  detailBtnText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  btnPressed: {
    opacity: 0.8,
  },
});
