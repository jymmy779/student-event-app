import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return <SafeAreaProvider>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#1e3a8a" }, headerTintColor: "#fff", contentStyle: { backgroundColor: "#f5f7fb" } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  </SafeAreaProvider>;
}
