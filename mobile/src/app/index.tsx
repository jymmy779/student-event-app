import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AccountScreen() {
  const { authenticate } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [organizer, setOrganizer] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError("");
    try {
      const result = isSignup
        ? await api.signUp(name, email, password, organizer ? inviteCode : undefined)
        : await api.login(email, password);
      await authenticate(result.token, result.user);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ."); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.page}>
    <View style={styles.card}>
      <Text style={styles.brand}>STUDENT EVENTS</Text>
      <Text style={styles.title}>{isSignup ? "Tạo tài khoản" : "Đăng nhập"}</Text>
      {isSignup && <TextInput value={name} onChangeText={setName} placeholder="Họ tên" style={styles.input} />}
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu (tối thiểu 8 ký tự)" secureTextEntry style={styles.input} />
      {isSignup && <Pressable onPress={() => setOrganizer(!organizer)}><Text style={styles.link}>{organizer ? "✓ Tạo tài khoản người tổ chức" : "Đăng ký với tư cách người tổ chức?"}</Text></Pressable>}
      {isSignup && organizer && <TextInput value={inviteCode} onChangeText={setInviteCode} placeholder="Mã mời người tổ chức" secureTextEntry style={styles.input} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable disabled={busy} onPress={() => void submit()} style={styles.button}><Text style={styles.buttonText}>{busy ? "Đang xử lý…" : isSignup ? "Đăng ký" : "Đăng nhập"}</Text></Pressable>
      <Pressable onPress={() => { setIsSignup(!isSignup); setError(""); }}><Text style={styles.link}>{isSignup ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, justifyContent: "center", backgroundColor: "#f5f7fb", padding: 22 }, card: { backgroundColor: "white", borderRadius: 20, padding: 24, gap: 14 }, brand: { color: "#1d4ed8", fontSize: 12, fontWeight: "800", letterSpacing: 2 }, title: { color: "#172554", fontSize: 28, fontWeight: "800", marginBottom: 4 }, input: { borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 16, color: "#0f172a" }, button: { backgroundColor: "#1d4ed8", padding: 15, borderRadius: 10, alignItems: "center" }, buttonText: { color: "white", fontWeight: "700", fontSize: 16 }, link: { color: "#1d4ed8", paddingVertical: 5, fontWeight: "600" }, error: { color: "#b91c1c", lineHeight: 20 } });
