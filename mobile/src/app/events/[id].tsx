import { useCallback, useState } from "react";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { ApiRequestError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (active: () => boolean) => {
    if (!id) { setError("Thiếu mã sự kiện."); setLoading(false); return; }
    setLoading(true); setError(null);
    try { const data = await api.event(id); if (active()) setEvent(data); }
    catch (caught) { if (active()) setError(caught instanceof Error ? caught.message : "Không thể tải chi tiết."); }
    finally { if (active()) setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => {
    let active = true;
    const requestVersion = reloadKey;
    void load(() => active && requestVersion === reloadKey);
    return () => { active = false; };
  }, [load, reloadKey]));

  async function toggleRegistration() {
    if (!event || sending) return;
    setSending(true); setActionError(null);
    try {
      if (event.registration.isRegistered) await api.unregister(event.id); else await api.register(event.id);
      const updated = await api.event(event.id);
      setEvent(updated);
    } catch (caught) {
      setActionError(caught instanceof ApiRequestError ? caught.message : "Không thể cập nhật đăng ký.");
    } finally { setSending(false); }
  }

  return <View style={styles.screen}>
    <Stack.Screen options={{ headerShown: true, title: "Chi tiết sự kiện", headerStyle: { backgroundColor: "#1e3a8a" }, headerTintColor: "#fff" }} />
    {loading ? <LoadingState label="Đang tải chi tiết…" /> : error || !event ? <ErrorState message={error ?? "Không tìm thấy sự kiện."} onRetry={() => setReloadKey((value) => value + 1)} /> :
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        {event.registration.isRegistered && <Text style={styles.badge}>{event.registration.checkedInAt ? "Đã check-in" : "Đã đăng ký"}</Text>}
        <View style={styles.info}><Text style={styles.label}>Bắt đầu</Text><Text style={styles.value}>{formatDate(event.startsAt)}</Text></View>
        <View style={styles.info}><Text style={styles.label}>Kết thúc</Text><Text style={styles.value}>{formatDate(event.endsAt)}</Text></View>
        <View style={styles.info}><Text style={styles.label}>Địa điểm</Text><Text style={styles.value}>{event.location}</Text></View>
        <Text style={styles.sectionTitle}>Giới thiệu</Text><Text style={styles.description}>{event.description}</Text>
        {actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}
        <Pressable accessibilityRole="button" disabled={sending || Boolean(event.registration.checkedInAt)} onPress={toggleRegistration} style={({ pressed }) => [styles.button, event.registration.isRegistered && styles.cancelButton, (sending || event.registration.checkedInAt) && styles.disabled, pressed && !sending && styles.pressed]}>
          <Text style={styles.buttonText}>{sending ? "Đang xử lý…" : event.registration.checkedInAt ? "Đã check-in — không thể hủy" : event.registration.isRegistered ? "Hủy đăng ký" : "Đăng ký sự kiện"}</Text>
        </Pressable>
      </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 }, content: { padding: 22 }, title: { color: "#172554", fontSize: 28, fontWeight: "800", lineHeight: 35 }, badge: { alignSelf: "flex-start", backgroundColor: "#dcfce7", borderRadius: 8, color: "#166534", fontSize: 13, fontWeight: "700", marginTop: 12, paddingHorizontal: 10, paddingVertical: 6 },
  info: { borderBottomColor: "#e2e8f0", borderBottomWidth: 1, marginTop: 18, paddingBottom: 12 }, label: { color: "#64748b", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }, value: { color: "#1e293b", fontSize: 16, marginTop: 5 }, sectionTitle: { color: "#172554", fontSize: 19, fontWeight: "700", marginTop: 24 }, description: { color: "#475569", fontSize: 16, lineHeight: 24, marginTop: 8 },
  error: { backgroundColor: "#fee2e2", borderRadius: 10, color: "#991b1b", marginTop: 20, padding: 12 }, button: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 12, marginTop: 24, padding: 15 }, cancelButton: { backgroundColor: "#b91c1c" }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.8 }, buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
