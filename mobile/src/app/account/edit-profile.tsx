import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() {
    setBusy(true); setError(""); setSaved(false);
    try { updateUser(await api.updateProfile({ name, email })); setSaved(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể lưu thông tin."); }
    finally { setBusy(false); }
  }
  return <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>HỒ SƠ</Text><Text style={styles.title}>Thông tin cá nhân</Text>
    <View style={styles.card}>
      <Text style={styles.label}>Họ và tên</Text><TextInput value={name} onChangeText={setName} autoCapitalize="words" style={styles.input} />
      <Text style={styles.label}>Email</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <Text style={styles.label}>Vai trò</Text><Text style={styles.role}>{user?.role === "ORGANIZER" ? "Người tổ chức" : "Sinh viên"} · do hệ thống quản lý</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}{saved && <Text style={styles.success}>Đã lưu thông tin.</Text>}
      <Pressable disabled={busy} onPress={() => void save()} style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.buttonText}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</Text></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#f5f7fb" }, content: { padding: 20, gap: 12 }, eyebrow: { color: "#1d4ed8", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, title: { color: "#172554", fontSize: 27, fontWeight: "800", marginBottom: 8 }, card: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 16, borderWidth: 1, gap: 10, padding: 18 }, label: { color: "#475569", fontSize: 12, fontWeight: "700", marginTop: 4 }, input: { borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, color: "#172554", fontSize: 15, padding: 12 }, role: { color: "#64748b", fontSize: 14, paddingVertical: 5 }, button: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 10, marginTop: 8, padding: 14 }, buttonText: { color: "white", fontSize: 14, fontWeight: "800" }, error: { color: "#b91c1c", fontSize: 13 }, success: { color: "#047857", fontSize: 13 }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.55 }, back: { alignSelf: "center", padding: 12 }, backText: { color: "#1d4ed8", fontWeight: "700" } });
