import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function LoadingState({ label = "Đang tải…" }: { label?: string }) {
  return <View style={styles.container}><ActivityIndicator size="large" color="#1d4ed8" /><Text style={styles.text}>{label}</Text></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.container}><Text style={styles.title}>Không tải được dữ liệu</Text><Text style={styles.text}>{message}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}><Text style={styles.buttonText}>Thử lại</Text></Pressable></View>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <View style={styles.container}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  title: { color: "#172554", fontSize: 20, fontWeight: "700", textAlign: "center" },
  text: { color: "#64748b", fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: "center" },
  button: { backgroundColor: "#1d4ed8", borderRadius: 10, marginTop: 20, paddingHorizontal: 22, paddingVertical: 12 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
