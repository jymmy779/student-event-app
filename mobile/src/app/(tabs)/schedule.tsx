import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { eventStatus, formatDate } from "@/lib/format";
import type { Registration } from "@/lib/types";

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    const requestVersion = reloadKey;
    async function load() {
      setLoading(true); setError(null);
      try { const data = await api.registrations(); if (active && requestVersion === reloadKey) setItems(data); }
      catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải lịch."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [reloadKey]));

  return <View style={styles.screen}>
    <View style={[styles.header, { paddingTop: insets.top }]}><View style={styles.headerContent}><Text style={styles.heading}>Lịch của tôi</Text><Text style={styles.subtitle}>Các sự kiện đã đăng ký được lưu trên máy chủ.</Text></View></View>
    {loading ? <LoadingState label="Đang tải lịch…" /> : error ? <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} /> :
      <FlatList contentContainerStyle={items.length ? styles.list : styles.empty} data={items} keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="Lịch đang trống" message="Đăng ký một sự kiện từ tab Khám phá để thêm vào lịch." />}
        renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.eventId } })} style={styles.card}>
          <Text style={styles.status}>{eventStatus(item.event.startsAt, item.event.endsAt, item.checkedInAt)}</Text><Text style={styles.title}>{item.event.title}</Text><Text style={styles.meta}>{formatDate(item.event.startsAt)}</Text><Text style={styles.meta}>📍 {item.event.location}</Text>
        </Pressable>} />}
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 }, header: { backgroundColor: "#1e3a8a" }, headerContent: { paddingHorizontal: 20, paddingVertical: 18 }, heading: { color: "#fff", fontSize: 28, fontWeight: "800" }, subtitle: { color: "#dbeafe", fontSize: 14, marginTop: 6 }, list: { gap: 14, padding: 16 }, empty: { flexGrow: 1 },
  card: { backgroundColor: "#fff", borderRadius: 16, elevation: 2, padding: 18, shadowColor: "#172554", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }, status: { color: "#1d4ed8", fontSize: 12, fontWeight: "800", marginBottom: 7, textTransform: "uppercase" }, title: { color: "#172554", fontSize: 18, fontWeight: "700" }, meta: { color: "#475569", fontSize: 14, marginTop: 7 },
});
