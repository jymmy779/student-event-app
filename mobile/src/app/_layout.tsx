import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LoadingState } from "@/components/ScreenState";

function RootNavigator() {
  const { token, loading } = useAuth();
  const segments = useSegments() as string[];
  const atLogin = !segments[0] || segments[0] === "index";
  const darkStatusIcons = atLogin || (segments[0] === "(tabs)" && (segments[1] === "organizer" || segments[1] === "profile"));

  if (loading) return <><StatusBar style="dark" /><SafeAreaView style={{ flex: 1, backgroundColor: "#f5f7fb" }}><LoadingState label="Đang khôi phục phiên đăng nhập…" /></SafeAreaView></>;
  if (!token && !atLogin) return <Redirect href="/" />;
  if (token && atLogin) return <Redirect href="/explore" />;

  return <>
  <StatusBar style={darkStatusIcons ? "dark" : "light"} />
  <Stack
    screenOptions={{
      headerStyle: { backgroundColor: "#1e3a8a" },
      headerTintColor: "#fff",
      contentStyle: { backgroundColor: "#f5f7fb" },
    }}
  >
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="organizer/event-form" options={{ title: "Quản lý sự kiện" }} />
    <Stack.Screen name="organizer/events/[id]/stats" options={{ title: "Thống kê sự kiện" }} />
    <Stack.Screen name="events/[id]" options={{ title: "Chi tiết sự kiện" }} />
    <Stack.Screen name="notes/[eventId]" options={{ title: "Ghi chú & Tóm tắt AI" }} />
    <Stack.Screen name="check-in" options={{ title: "Quét QR check-in" }} />
    <Stack.Screen name="account/edit-profile" options={{ title: "Thông tin cá nhân" }} />
    <Stack.Screen name="account/security" options={{ title: "Bảo mật" }} />
    <Stack.Screen name="account/help" options={{ title: "Hướng dẫn và hỗ trợ" }} />
  </Stack>
  </>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
