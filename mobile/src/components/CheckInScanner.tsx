import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "@/lib/api";
import { parseCheckInQrValue } from "@/lib/check-in";

export function CheckInScanner({ expectedEventId }: { expectedEventId?: string }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState("Đưa mã QR sự kiện vào khung quét.");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completedEventId, setCompletedEventId] = useState<string | null>(null);
  const scanning = useRef(false);

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanning.current || completed) return;
    scanning.current = true;
    setError(null);
    setMessage("Đang xác minh QR với máy chủ…");
    try {
      const payload = parseCheckInQrValue(data);
      if (!payload) throw new Error("QR phải sử dụng bằng APP Student Event.");
      if (expectedEventId && payload.eventId !== expectedEventId) throw new Error("QR không đúng với sự kiện đang mở.");
      await api.checkIn(payload.eventId, payload.token);
      setCompletedEventId(payload.eventId);
      setCompleted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể check-in.");
      setMessage("Bạn có thể đưa lại QR vào khung để thử lại.");
      scanning.current = false;
    }
  }

  if (!permission) return <View style={styles.center}><Text>Đang kiểm tra quyền camera…</Text></View>;
  if (!permission.granted) return <View style={styles.center}>
    <Text style={styles.title}>Cần quyền camera</Text>
    <Text style={styles.description}>Camera chỉ được dùng để đọc mã QR check-in.</Text>
    <Button title="Cho phép camera" onPress={() => void requestPermission()} />
  </View>;

  if (completed && completedEventId) return <View style={styles.successScreen}>
    <View style={styles.successCard}>
      <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
      <Text style={styles.successTitle}>Check-in thành công!</Text>
      <Text style={styles.successMessage}>Bạn đã check-in sự kiện thành công. Thông tin đã được cập nhật vào lịch của bạn.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace({ pathname: "/events/[id]", params: { id: completedEventId } })}
        style={styles.successButton}
      >
        <Text style={styles.successButtonText}>Xác nhận và xem sự kiện</Text>
      </Pressable>
    </View>
  </View>;

  return <View style={styles.screen}>
    <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={handleBarcodeScanned} />
    <View style={styles.overlay}>
      <View style={styles.scanFrame} />
      <View style={styles.messageCard}>
        <Text style={styles.message}>{message}</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {completed && <Pressable style={styles.button} onPress={() => router.replace("/schedule")}><Text style={styles.buttonText}>Về lịch của tôi</Text></Pressable>}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#0f172a", flex: 1 },
  successScreen: { alignItems: "center", backgroundColor: "#eff6ff", flex: 1, justifyContent: "center", padding: 24 },
  successCard: { alignItems: "center", backgroundColor: "#fff", borderRadius: 24, elevation: 4, padding: 28, shadowColor: "#172554", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, width: "100%" },
  successIcon: { alignItems: "center", backgroundColor: "#dcfce7", borderRadius: 50, height: 88, justifyContent: "center", width: 88 },
  successIconText: { color: "#16a34a", fontSize: 58, fontWeight: "800", lineHeight: 68 },
  successTitle: { color: "#166534", fontSize: 28, fontWeight: "900", marginTop: 22, textAlign: "center" },
  successMessage: { color: "#475569", fontSize: 17, lineHeight: 26, marginTop: 12, textAlign: "center" },
  successButton: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 12, marginTop: 24, padding: 15, width: "100%" },
  successButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  center: { alignItems: "center", backgroundColor: "#f5f7fb", flex: 1, gap: 14, justifyContent: "center", padding: 24 },
  title: { color: "#172554", fontSize: 22, fontWeight: "800", textAlign: "center" },
  description: { color: "#475569", fontSize: 15, textAlign: "center" },
  overlay: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  scanFrame: { borderColor: "#fff", borderRadius: 24, borderWidth: 3, height: 250, width: 250 },
  messageCard: { backgroundColor: "rgba(15,23,42,0.88)", borderRadius: 16, marginTop: 28, padding: 18, width: "100%" },
  message: { color: "#fff", fontSize: 16, lineHeight: 23, textAlign: "center" },
  error: { color: "#fda4af", fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: "center" },
  button: { alignItems: "center", backgroundColor: "#2563eb", borderRadius: 10, marginTop: 14, padding: 13 },
  buttonText: { color: "#fff", fontWeight: "800" },
});
