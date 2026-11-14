import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { useAuth } from "@/lib/auth-context";

type TabIconProps = Pick<ComponentProps<typeof SymbolView>, "name" | "tintColor">;

function TabIcon({ name, tintColor }: TabIconProps) {
  return <SymbolView name={name} tintColor={tintColor} size={22} />;
}

export default function TabsLayout() {
  const { user } = useAuth();
  const isOrganizer = user?.role === "ORGANIZER";
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1d4ed8", tabBarHideOnKeyboard: true }}>
    <Tabs.Screen name="explore" options={{ title: "Khám phá", tabBarIcon: ({ color }) => <TabIcon tintColor={color} name={{ ios: "magnifyingglass", android: "search", web: "search" }} /> }} />
    <Tabs.Screen name="schedule" options={{ href: isOrganizer ? null : undefined, title: "Lịch của tôi", tabBarIcon: ({ color }) => <TabIcon tintColor={color} name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }} /> }} />
    <Tabs.Screen name="scan" options={{ href: isOrganizer ? null : undefined, title: "Quét QR", tabBarIcon: ({ color }) => <TabIcon tintColor={color} name={{ ios: "qrcode.viewfinder", android: "qr_code_scanner", web: "qr_code_scanner" }} /> }} />
    <Tabs.Screen name="organizer" options={{ href: isOrganizer ? undefined : null, title: "Tổ chức", tabBarIcon: ({ color }) => <TabIcon tintColor={color} name={{ ios: "square.grid.2x2", android: "dashboard", web: "dashboard" }} /> }} />
    <Tabs.Screen name="profile" options={{ title: "Hồ sơ", tabBarIcon: ({ color }) => <TabIcon tintColor={color} name={{ ios: "person.crop.circle", android: "account_circle", web: "account_circle" }} /> }} />
  </Tabs>;
}
