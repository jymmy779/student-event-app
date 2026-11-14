import { Stack } from "expo-router";
import { CheckInScanner } from "@/components/CheckInScanner";

export default function ScanScreen() {
  return <>
    <Stack.Screen options={{ title: "Quét QR check-in" }} />
    <CheckInScanner />
  </>;
}
