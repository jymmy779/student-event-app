import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { api, ApiRequestError } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatDate } from "@/lib/format";
import {
  cancelEventReminder,
  requestNotificationPermission,
  saveNotificationId,
  scheduleEventReminder,
} from "@/lib/notifications";
import type { Registration } from "@/lib/types";

type Props = {
  eventId: string;
  registration: Registration | null;
  eventTitle?: string;
  eventStartsAt?: string;
  expired?: boolean;
  full?: boolean;
  registrationClosed?: boolean;
  onChange: (registration: Registration | null) => void;
};

// Mount with key={eventId} when the selected event can change.
export function RegistrationActions({
  eventId,
  registration,
  eventTitle,
  eventStartsAt,
  expired = false,
  full = false,
  registrationClosed = false,
  onChange,
}: Props) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
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
        await cancelEventReminder(eventId);
        updated = null;
        if (mounted.current) setPermissionDenied(false);
      } else {
        updated = await api.register(eventId);
        if (eventTitle && eventStartsAt) {
          const notifId = await scheduleEventReminder(eventId, eventTitle, eventStartsAt);
          if (notifId) {
            await saveNotificationId(eventId, notifId);
          } else {
            // Check if reminder is in the future but permission was denied
            const remindTime = new Date(eventStartsAt).getTime() - 30 * 60 * 1000;
            if (remindTime > Date.now()) {
              const hasPermission = await requestNotificationPermission();
              if (!hasPermission && mounted.current) {
                setPermissionDenied(true);
              }
            }
          }
        }
      }
      if (mounted.current) {
        setConfirming(false);
        onChange(updated);
      }
    } catch (caught) {
      if (!mounted.current) return;
      setError(
        caught instanceof Error
          ? caught.message
          : "Không thể cập nhật đăng ký. Vui lòng thử lại.",
      );
      // Another device may already have checked in. Refresh the server state.
      if (
        caught instanceof ApiRequestError &&
        caught.code === "ALREADY_CHECKED_IN"
      ) {
        try {
          const latest = await api.event(eventId);
          if (mounted.current) {
            setConfirming(false);
            onChange(latest.registration);
          }
        } catch {
          /* Preserve the original error for retry. */
        }
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {registration?.checkedInAt
          ? "Đã check-in"
          : registration
          ? "Đã đăng ký"
          : expired
          ? "Đã hết hạn"
          : full
          ? "Đã đủ chỗ"
          : registrationClosed
          ? "Đã đóng đăng ký"
          : "Chưa đăng ký"}
      </Text>
      {registration?.checkedInAt ? (
        <Text style={styles.hint}>
          Check-in lúc {formatDate(registration.checkedInAt)}. Bạn không thể hủy
          đăng ký sau check-in.
        </Text>
      ) : expired && !registration ? (
        <Text style={styles.hint}>
          Sự kiện đã kết thúc, hiện không thể đăng ký thêm.
        </Text>
      ) : full && !registration ? (
        <Text style={styles.hint}>Sự kiện đã đủ số người tham gia.</Text>
      ) : registrationClosed && !registration ? (
        <Text style={styles.hint}>Đã qua hạn đăng ký sự kiện.</Text>
      ) : (
        <>
          <Text style={styles.hint}>
            {registration
              ? "Sự kiện đã có trong Lịch của tôi. Bạn có thể hủy trước khi check-in."
              : "Đăng ký để thêm sự kiện vào lịch của bạn."}
          </Text>
          {permissionDenied && (
            <Text style={styles.notifHint}>
              Chưa bật thông báo — bật trong Cài đặt để nhận nhắc giờ sự kiện.
            </Text>
          )}
          <ConfirmModal
            visible={confirming}
            title="Hủy đăng ký?"
            message="Hủy đăng ký và xóa sự kiện khỏi lịch của bạn?"
            confirmLabel="Xác nhận hủy"
            cancelLabel="Giữ đăng ký"
            destructive
            loading={pending}
            onConfirm={() => void submit()}
            onCancel={() => setConfirming(false)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: pending, busy: pending }}
            disabled={pending}
            onPress={() => {
              if (registration && !confirming) {
                setConfirming(true);
                setError(null);
              } else void submit();
            }}
            style={({ pressed }) => [
              styles.button,
              registration && styles.cancel,
              (pressed || pending) && styles.dimmed,
            ]}
          >
            {pending && (
              <ActivityIndicator color={registration ? "#b91c1c" : "#fff"} />
            )}
            <Text
              style={[styles.buttonText, registration && styles.cancelText]}
            >
              {pending
                ? "Đang xử lý…"
                : registration
                ? "Hủy đăng ký"
                : "Đăng ký tham gia"}
            </Text>
          </Pressable>
        </>
      )}
      {error && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.error}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  status: { color: "#1e3a8a", fontSize: 16, fontWeight: "700" },
  hint: { color: "#64748b", fontSize: 14, lineHeight: 21 },
  notifHint: { color: "#d97706", fontSize: 13, lineHeight: 18 },
  button: {
    minHeight: 48,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  cancel: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelText: { color: "#b91c1c" },
  dimmed: { opacity: 0.6 },
  error: { color: "#b91c1c", fontSize: 14, lineHeight: 21 },
});
