import { useCallback, useState } from "react";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export default function EventDetailScreen() {
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

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  eyebrow: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    color: "#172554",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
    marginTop: 6,
  },
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
