import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  return <View style={styles.screen}>
    <View style={[styles.header, { paddingTop: insets.top }]}><View style={styles.headerContent}><Text style={styles.heading}>Lịch của tôi</Text></View></View>
    <View style={styles.content}><Text style={styles.title}>Chức năng đang được phát triển</Text><Text style={styles.message}>Thành viên phụ trách sẽ triển khai lịch cá nhân bằng API và dữ liệu SQLite thật.</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 }, header: { backgroundColor: "#1e3a8a" }, headerContent: { paddingHorizontal: 20, paddingVertical: 18 }, heading: { color: "#fff", fontSize: 28, fontWeight: "800" },
  content: { alignItems: "center", flex: 1, justifyContent: "center", padding: 28 }, title: { color: "#172554", fontSize: 20, fontWeight: "700", textAlign: "center" }, message: { color: "#64748b", fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: "center" },
});
