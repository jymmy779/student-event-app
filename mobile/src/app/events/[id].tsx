import { useCallback, useState } from "react";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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
});
