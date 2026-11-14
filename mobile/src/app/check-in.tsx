import { Stack, useLocalSearchParams } from "expo-router";
import { CheckInScanner } from "@/components/CheckInScanner";

export default function CheckInScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  return <>
    <Stack.Screen options={{ title: "Quét QR check-in" }} />
    <CheckInScanner expectedEventId={eventId} />
  </>;
}
