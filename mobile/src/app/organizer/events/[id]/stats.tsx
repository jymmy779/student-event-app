import { useCallback, useState } from "react";
import { Redirect, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Stats = {
  event: { id: string; title: string; capacity: number; remainingSlots: number };
  registered: number;
  checkedIn: number;
  notCheckedIn: number;
  attendanceRate: number;
};

export default function OrganizerEventStatsScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    if (!id) {
      setError("Thiếu mã sự kiện.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void api.organizerStats(id)
      .then((result) => { if (active) setStats(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Không tải được thống kê."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reloadKey]));

  if (user?.role !== "ORGANIZER") return <Redirect href="/explore" />;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <Stack.Screen options={{ title: "Thống kê sự kiện" }} />
      {loading ? <LoadingState label="Đang tải thống kê…" /> : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : stats ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>THỐNG KÊ SỰ KIỆN</Text>
          <Text style={styles.title}>{stats.event.title}</Text>
          <Text style={styles.capacity}>Sức chứa {stats.event.capacity} · Còn {stats.event.remainingSlots} chỗ</Text>
          <View style={styles.grid}>
            <Metric label="Đã đăng ký" value={stats.registered} />
            <Metric label="Đã check-in" value={stats.checkedIn} />
            <Metric label="Chưa check-in" value={stats.notCheckedIn} />
            <Metric label="Tỷ lệ tham dự" value={`${Math.round(stats.attendanceRate * 100)}%`} />
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 },
  content: { gap: 18, padding: 20, paddingBottom: 36 },
  eyebrow: { color: "#1d4ed8", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#172554", fontSize: 27, fontWeight: "800", lineHeight: 34 },
  capacity: { color: "#64748b", fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 14, borderWidth: 1, flexBasis: "47%", flexGrow: 1, gap: 7, minHeight: 112, justifyContent: "center", padding: 16 },
  metricValue: { color: "#1d4ed8", fontSize: 28, fontWeight: "800" },
  metricLabel: { color: "#64748b", fontSize: 13, fontWeight: "600" },
});
