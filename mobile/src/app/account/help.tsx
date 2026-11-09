import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpScreen() {
  return <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>TRỢ GIÚP</Text><Text style={styles.title}>Hướng dẫn sử dụng</Text>
    <Guide number="01" title="Tìm sự kiện" detail="Mở Khám phá, nhập từ khóa vào ô tìm kiếm, rồi chọn sự kiện để xem nội dung, thời gian và địa điểm." />
    <Guide number="02" title="Đăng ký tham gia" detail="Trong trang chi tiết sự kiện, nhấn Đăng ký. Có thể hủy trước khi check-in." />
    <Guide number="03" title="Xem lịch cá nhân" detail="Mở Lịch của tôi để xem các sự kiện đã đăng ký. Danh sách đồng bộ với tài khoản trên máy chủ." />
    <Guide number="04" title="Tạo và quản lý sự kiện" detail="Tài khoản người tổ chức có tab Tổ chức để tạo sự kiện và xem thống kê đăng ký/check-in." />
    <View style={styles.supportCard}><Text style={styles.cardTitle}>Sự cố kết nối?</Text><Text style={styles.body}>Kiểm tra máy chủ đang chạy, URL API trong mobile/.env đúng IP Wi-Fi của máy chủ, và điện thoại với máy chủ cùng mạng.</Text><Text style={styles.support}>Student Events · Bản thử nghiệm</Text></View>
  </ScrollView></SafeAreaView>;
}

function Guide({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <View style={styles.guide}><Text style={styles.number}>{number}</Text><View style={styles.copy}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{detail}</Text></View></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#f5f7fb" }, content: { padding: 20, gap: 13 }, eyebrow: { color: "#1d4ed8", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, title: { color: "#172554", fontSize: 27, fontWeight: "800", marginBottom: 8 }, guide: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 13, padding: 16 }, number: { color: "#1d4ed8", fontSize: 14, fontWeight: "800" }, copy: { flex: 1, gap: 5 }, cardTitle: { color: "#172554", fontSize: 15, fontWeight: "800" }, body: { color: "#64748b", fontSize: 13, lineHeight: 20 }, supportCard: { backgroundColor: "#eff6ff", borderRadius: 15, gap: 8, marginTop: 5, padding: 17 }, support: { color: "#1d4ed8", fontSize: 12, fontWeight: "700", marginTop: 5 }, back: { alignSelf: "center", padding: 12 }, backText: { color: "#1d4ed8", fontWeight: "700" } });
