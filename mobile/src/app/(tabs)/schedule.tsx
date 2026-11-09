import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ScreenState";
import { RegistrationActions } from "@/components/RegistrationActions";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
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
  const requestVersion = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const version = ++requestVersion.current;
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const items = await api.registrations();
      if (version === requestVersion.current) setRegistrations(items);
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
    setRegistrations((current) => registration
      ? current.map((item) => item.eventId === eventId ? { ...item, ...registration } : item)
      : current.filter((item) => item.eventId !== eventId));
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
              <RegistrationActions
                eventId={item.eventId}
                registration={item}
                onChange={(registration) => updateRegistration(item.eventId, registration)}
              />
            </View>
          )}
        />
      )}
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
});
