import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ registered: number; checkedIn: number; upcoming: number; createdEvents: number } | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    void api.myStats().then((result) => { if (active) setStats(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Không tải được thống kê."); });
    return () => { active = false; };
  }, []));
  async function handleSignOut() {
    setBusy(true); setError("");
    try { await signOut(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể đăng xuất."); }
    finally { setBusy(false); }
  }
  return <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>TÀI KHOẢN</Text>
      <Text style={styles.heading}>Hồ sơ</Text>
      <View style={styles.hero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name.trim().charAt(0).toLocaleUpperCase() ?? "?"}</Text></View>
        <View style={styles.identity}><Text numberOfLines={1} style={styles.name}>{user?.name ?? ""}</Text><Text numberOfLines={1} style={styles.email}>{user?.email ?? ""}</Text><Text style={styles.role}>{user?.role === "ORGANIZER" ? "Người tổ chức" : "Sinh viên"}</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Hoạt động của bạn</Text>
      {stats ? <View style={styles.statsGrid}>
        <StatCard value={stats.registered} label="Đã đăng ký" accent="#1d4ed8" />
        <StatCard value={stats.upcoming} label="Sắp diễn ra" accent="#0f766e" />
        <StatCard value={stats.checkedIn} label="Đã check-in" accent="#7c3aed" />
        {user?.role === "ORGANIZER" && <StatCard value={stats.createdEvents} label="Sự kiện đã tạo" accent="#c2410c" />}
      </View> : <Text style={styles.statsMessage}>Đang tải thống kê…</Text>}

      <Text style={styles.sectionTitle}>Tài khoản của tôi</Text>
      <View style={styles.menu}>
        <MenuRow title="Thông tin cá nhân" detail="Cập nhật họ tên và email" icon="◉" onPress={() => router.push("/account/edit-profile")} />
        <MenuRow title="Bảo mật" detail="Đổi mật khẩu tài khoản" icon="◇" onPress={() => router.push("/account/security")} />
        <MenuRow title="Hướng dẫn và hỗ trợ" detail="Cách sử dụng và xử lý sự cố" icon="?" last onPress={() => router.push("/account/help")} />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void handleSignOut()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed, busy && styles.disabled]}>
        <Text style={styles.signOutText}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</Text>
      </Pressable>
      <Text style={styles.footer}>Student Events · Tài khoản cá nhân</Text>
    </ScrollView>
  </SafeAreaView>;
}

function MenuRow({ title, detail, icon, onPress, last }: { title: string; detail: string; icon: string; onPress: () => void; last?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.rowPressed]}>
    <View style={styles.iconBox}><Text style={styles.icon}>{icon}</Text></View>
    <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>;
}

function StatCard({ value, label, accent }: { value: number; label: string; accent: string }) {
  return <View style={styles.statCard}><Text style={[styles.statValue, { color: accent }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 18, paddingBottom: 32 },
  eyebrow: { color: "#1d4ed8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  heading: { color: "#172554", fontSize: 28, fontWeight: "800", marginBottom: 16, marginTop: 3 },
  hero: { alignItems: "center", backgroundColor: "#1e3a8a", borderRadius: 18, flexDirection: "row", gap: 14, padding: 18 },
  avatar: { alignItems: "center", backgroundColor: "#bfdbfe", borderRadius: 32, height: 64, justifyContent: "center", width: 64 },
  avatarText: { color: "#1e3a8a", fontSize: 27, fontWeight: "800" },
  identity: { flex: 1 },
  name: { color: "white", fontSize: 19, fontWeight: "800" },
  email: { color: "#dbeafe", fontSize: 14, marginTop: 4 },
  role: { alignSelf: "flex-start", backgroundColor: "#dbeafe", borderRadius: 99, color: "#1e3a8a", fontSize: 11, fontWeight: "800", marginTop: 10, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5 },
  sectionTitle: { color: "#172554", fontSize: 16, fontWeight: "800", marginBottom: 9, marginTop: 24 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 14, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minHeight: 82, padding: 13 },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { color: "#64748b", fontSize: 12, fontWeight: "600", marginTop: 4 },
  statsMessage: { color: "#64748b", fontSize: 13 },
  menu: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 76, paddingVertical: 12 },
  rowBorder: { borderBottomColor: "#e8edf5", borderBottomWidth: 1 },
  rowPressed: { opacity: 0.65 },
  iconBox: { alignItems: "center", backgroundColor: "#eff6ff", borderRadius: 11, height: 40, justifyContent: "center", width: 40 },
  icon: { color: "#1d4ed8", fontSize: 20, fontWeight: "800" },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { color: "#172554", fontSize: 14, fontWeight: "700" },
  rowDetail: { color: "#64748b", fontSize: 12 },
  chevron: { color: "#94a3b8", fontSize: 25, paddingHorizontal: 4 },
  signOut: { alignItems: "center", backgroundColor: "#fff1f2", borderColor: "#fecdd3", borderRadius: 12, borderWidth: 1, marginTop: 22, padding: 15 },
  signOutText: { color: "#be123c", fontSize: 14, fontWeight: "800" },
  error: { color: "#b91c1c", marginTop: 12 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
  footer: { color: "#94a3b8", fontSize: 11, marginTop: 18, textAlign: "center" },
});
