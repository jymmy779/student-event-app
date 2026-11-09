import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";

export default function SecurityScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() {
    setError(""); setSaved(false);
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận chưa khớp."); return; }
    setBusy(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu."); }
    finally { setBusy(false); }
  }
  return <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>TÀI KHOẢN</Text><Text style={styles.title}>Bảo mật</Text>
    <View style={styles.card}>
      <Text style={styles.description}>Đặt mật khẩu mới có ít nhất 8 ký tự. Sau khi đổi, các thiết bị khác sẽ phải đăng nhập lại.</Text>
      <Field label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} />
      <Field label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} />
      <Field label="Nhập lại mật khẩu mới" value={confirmPassword} onChangeText={setConfirmPassword} />
      {!!error && <Text style={styles.error}>{error}</Text>}{saved && <Text style={styles.success}>Đổi mật khẩu thành công.</Text>}
      <Pressable disabled={busy} onPress={() => void save()} style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.buttonText}>{busy ? "Đang cập nhật…" : "Cập nhật mật khẩu"}</Text></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} secureTextEntry autoCapitalize="none" style={styles.input} /></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#f5f7fb" }, content: { padding: 20, gap: 12 }, eyebrow: { color: "#1d4ed8", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, title: { color: "#172554", fontSize: 27, fontWeight: "800", marginBottom: 8 }, card: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 16, borderWidth: 1, gap: 14, padding: 18 }, description: { color: "#64748b", fontSize: 13, lineHeight: 20 }, field: { gap: 6 }, label: { color: "#475569", fontSize: 12, fontWeight: "700" }, input: { borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, color: "#172554", fontSize: 15, padding: 12 }, button: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 10, marginTop: 4, padding: 14 }, buttonText: { color: "white", fontSize: 14, fontWeight: "800" }, error: { color: "#b91c1c", fontSize: 13 }, success: { color: "#047857", fontSize: 13 }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.55 }, back: { alignSelf: "center", padding: 12 }, backText: { color: "#1d4ed8", fontWeight: "700" } });
