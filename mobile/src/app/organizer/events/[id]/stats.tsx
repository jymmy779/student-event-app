import { useCallback, useState } from "react";
import { Redirect, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { getCheckInQrValue } from "@/lib/check-in";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Stats = {
  event: { id: string; title: string; capacity: number; remainingSlots: number; qrToken: string };
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
  const [qrVisible, setQrVisible] = useState(false);

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
          <Pressable accessibilityRole="button" onPress={() => setQrVisible(true)} style={styles.qrButton}>
            <Text style={styles.qrButtonText}>Hiện QR check-in</Text>
          </Pressable>
          <View style={styles.grid}>
            <Metric label="Đã đăng ký" value={stats.registered} />
            <Metric label="Đã check-in" value={stats.checkedIn} />
            <Metric label="Chưa check-in" value={stats.notCheckedIn} />
            <Metric label="Tỷ lệ tham dự" value={`${Math.round(stats.attendanceRate * 100)}%`} />
          </View>
          <Modal animationType="fade" transparent visible={qrVisible} onRequestClose={() => setQrVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalEyebrow}>QR CHECK-IN</Text>
                <Text style={styles.modalTitle}>{stats.event.title}</Text>
                <Text style={styles.modalHint}>Đưa mã này cho sinh viên quét tại sự kiện</Text>
                <View style={styles.qrLarge}><QRCode value={getCheckInQrValue(stats.event.id, stats.event.qrToken)} size={280} backgroundColor="white" color="#0f172a" /></View>
                <Pressable accessibilityRole="button" onPress={() => setQrVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Đóng</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
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
  qrButton: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 12, padding: 14 },
  qrButtonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  modalBackdrop: { alignItems: "center", backgroundColor: "rgba(15,23,42,0.72)", flex: 1, justifyContent: "center", padding: 20 },
  modalCard: { alignItems: "center", backgroundColor: "#fff", borderRadius: 22, padding: 22, width: "100%" },
  modalEyebrow: { color: "#1d4ed8", fontSize: 12, fontWeight: "800", letterSpacing: 1.3 },
  modalTitle: { color: "#172554", fontSize: 20, fontWeight: "800", marginTop: 8, textAlign: "center" },
  modalHint: { color: "#64748b", fontSize: 14, marginTop: 8, textAlign: "center" },
  qrLarge: { alignItems: "center", backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: 14, borderWidth: 1, marginVertical: 20, padding: 14 },
  closeButton: { alignItems: "center", backgroundColor: "#e2e8f0", borderRadius: 10, padding: 13, width: "100%" },
  closeButtonText: { color: "#334155", fontSize: 15, fontWeight: "800" },
});
