import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { formatDate, formatEventFormat, getEventStatus } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestVersion = reloadKey;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await api.events(debouncedQuery);
          if (active && requestVersion === reloadKey) setEvents(data);
        } catch (caught) {
          if (active)
            setError(
              caught instanceof Error
                ? caught.message
                : "Không thể tải sự kiện.",
            );
        } finally {
          if (active) setLoading(false);
        }
      }
      void load();
      return () => {
        active = false;
      };
    }, [debouncedQuery, reloadKey]),
  );

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>STUDENT EVENTS</Text>
          <Text style={styles.heading}>Khám phá sự kiện</Text>
          <TextInput
            accessibilityLabel="Tìm sự kiện"
            placeholder="Tìm theo tên sự kiện…"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />
        </View>
      </SafeAreaView>
      {loading ? (
        <LoadingState label="Đang tải sự kiện…" />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <FlatList
          contentContainerStyle={events.length ? styles.list : styles.empty}
          data={events}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              title="Không tìm thấy sự kiện"
              message={
                query
                  ? "Thử một từ khóa khác."
                  : "Các sự kiện mới sẽ xuất hiện tại đây."
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityHint="Mở thông tin chi tiết của sự kiện"
              accessibilityRole="button"
              onPress={() =>
                router.navigate({
                  pathname: "/events/[id]",
                  params: { id: item.id },
                })
              }
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {getEventStatus(item) && (
                  <Text
                    style={[styles.statusBadge, styles[getEventStatus(item)!]]}
                  >
                    {getEventStatus(item) === "expired"
                      ? "Đã hết hạn"
                      : getEventStatus(item) === "ongoing"
                        ? "Đang diễn ra"
                        : "Mới"}
                  </Text>
                )}
              </View>
              <Text style={styles.meta}>{formatDate(item.startsAt)}</Text>
              <Text style={styles.meta}>📍 {item.location}</Text>
              <Text style={styles.meta}>{formatEventFormat(item.format)}</Text>
              <View style={styles.slotRow}>
                <Text style={styles.meta}>
                  {`Còn ${item.remainingSlots}/${item.capacity} chỗ`}
                  {item.remainingSlots <= 0 ? " · Đã đủ chỗ" : ""}
                  {item.registrationDeadline
                    ? ` · Hạn đăng ký ${formatDate(item.registrationDeadline)}`
                    : ""}
                </Text>
              </View>
              <Text numberOfLines={2} style={styles.description}>
                {item.description}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fb" },
  header: { backgroundColor: "#1e3a8a" },
  headerContent: { paddingHorizontal: 20, paddingVertical: 16 },
  eyebrow: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  heading: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 14,
    marginTop: 4,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 12,
    color: "#0f172a",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  list: { padding: 16, gap: 14 },
  empty: { flexGrow: 1 },
  card: {
    backgroundColor: "#fff",
    borderColor: "#dbe3f0",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    padding: 18,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardTitle: {
    color: "#172554",
    flex: 1,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    minWidth: 0,
    width: "100%",
  },
  slotRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  statusBadge: {
    borderRadius: 99,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  expired: { backgroundColor: "#f1f5f9", color: "#64748b" },
  ongoing: { backgroundColor: "#dcfce7", color: "#15803d" },
  new: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  cardPressed: { opacity: 0.75 },
  meta: { color: "#475569", fontSize: 14, marginTop: 7 },
  description: { color: "#64748b", fontSize: 14, lineHeight: 20, marginTop: 8 },
});
