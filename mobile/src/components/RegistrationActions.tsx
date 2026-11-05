import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { api, ApiRequestError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Registration } from "@/lib/types";

type Props = {
  eventId: string;
  registration: Registration | null;
  onChange: (registration: Registration | null) => void;
};

// Mount with key={eventId} when the selected event can change.
export function RegistrationActions({ eventId, registration, onChange }: Props) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit() {
    if (busy.current || registration?.checkedInAt) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      let updated: Registration | null;
      if (registration) {
        await api.cancelRegistration(eventId);
        updated = null;
      } else updated = await api.register(eventId);
      if (mounted.current) {
        setConfirming(false);
        onChange(updated);
      }
    } catch (caught) {
      if (!mounted.current) return;
      setError(caught instanceof Error ? caught.message : "Không thể cập nhật đăng ký. Vui lòng thử lại.");
      // Another device may already have checked in. Refresh the server state.
      if (caught instanceof ApiRequestError && caught.code === "ALREADY_CHECKED_IN") {
        try {
          const latest = await api.event(eventId);
          if (mounted.current) {
            setConfirming(false);
            onChange(latest.registration);
          }
        } catch { /* Preserve the original error for retry. */ }
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {registration?.checkedInAt ? "Đã check-in" : registration ? "Đã đăng ký" : "Chưa đăng ký"}
      </Text>
      {registration?.checkedInAt ? (
        <Text style={styles.hint}>Check-in lúc {formatDate(registration.checkedInAt)}. Bạn không thể hủy đăng ký sau check-in.</Text>
      ) : (
        <>
          <Text style={styles.hint}>
            {confirming ? "Hủy đăng ký và xóa sự kiện khỏi lịch của bạn?" : registration
              ? "Sự kiện đã có trong Lịch của tôi. Bạn có thể hủy trước khi check-in."
              : "Đăng ký để thêm sự kiện vào lịch của bạn."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: pending, busy: pending }}
            disabled={pending}
            onPress={() => {
              if (registration && !confirming) { setConfirming(true); setError(null); }
              else void submit();
            }}
            style={({ pressed }) => [styles.button, registration && styles.cancel, (pressed || pending) && styles.dimmed]}
          >
            {pending && <ActivityIndicator color={registration ? "#b91c1c" : "#fff"} />}
            <Text style={[styles.buttonText, registration && styles.cancelText]}>
              {pending ? "Đang xử lý…" : registration ? confirming ? "Xác nhận hủy đăng ký" : "Hủy đăng ký" : "Đăng ký tham gia"}
            </Text>
          </Pressable>
          {confirming && (
            <Pressable accessibilityRole="button" disabled={pending} onPress={() => setConfirming(false)} style={styles.keep}>
              <Text style={styles.keepText}>Giữ đăng ký</Text>
            </Pressable>
          )}
        </>
      )}
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  status: { color: "#1e3a8a", fontSize: 16, fontWeight: "700" },
  hint: { color: "#64748b", fontSize: 14, lineHeight: 21 },
  button: { minHeight: 48, padding: 12, borderRadius: 10, backgroundColor: "#1d4ed8", flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "center" },
  cancel: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  cancelText: { color: "#b91c1c" },
  dimmed: { opacity: 0.6 },
  keep: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  keepText: { color: "#1d4ed8", fontSize: 15, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 14, lineHeight: 21 },
});
