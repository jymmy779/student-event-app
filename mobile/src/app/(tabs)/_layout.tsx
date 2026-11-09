import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function TabsLayout() {
  const { user } = useAuth();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1d4ed8", tabBarHideOnKeyboard: true }}>
    <Tabs.Screen name="explore" options={{ title: "Khám phá", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌕</Text> }} />
    <Tabs.Screen name="schedule" options={{ title: "Lịch của tôi", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>▣</Text> }} />
    {user?.role === "ORGANIZER" && <Tabs.Screen name="organizer" options={{ title: "Tổ chức", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>＋</Text> }} />}
    <Tabs.Screen name="profile" options={{ title: "Hồ sơ", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>●</Text> }} />
  </Tabs>;
}
