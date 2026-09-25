import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1d4ed8", tabBarHideOnKeyboard: true }}>
    <Tabs.Screen name="explore" options={{ title: "Khám phá", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌕</Text> }} />
    <Tabs.Screen name="schedule" options={{ title: "Lịch của tôi", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>▣</Text> }} />
  </Tabs>;
}
