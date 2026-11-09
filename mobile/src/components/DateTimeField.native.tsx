import { useState } from "react";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = { label: string; value: Date; onChange: (value: Date) => void };

export function DateTimeField({ label, value, onChange }: Props) {
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={() => setPickerMode("date")}>
          <Text style={styles.buttonLabel}>Ngày</Text>
          <Text style={styles.value}>{value.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}</Text>
        </Pressable>
        <Pressable style={styles.timeButton} onPress={() => setPickerMode("time")}>
          <Text style={styles.buttonLabel}>Giờ</Text>
          <Text style={styles.value}>{value.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}</Text>
        </Pressable>
      </View>
      {pickerMode && <View style={styles.picker}>
        <DateTimePicker
          value={value}
          mode={pickerMode}
          is24Hour
          presentation="dialog"
          positiveButton={{ label: "Xong" }}
          negativeButton={{ label: "Hủy" }}
          onValueChange={(_event, selectedDate) => {
            onChange(selectedDate);
            if (Platform.OS === "android") setPickerMode(null);
          }}
          onDismiss={() => setPickerMode(null)}
        />
        {Platform.OS === "ios" && <Pressable onPress={() => setPickerMode(null)} style={styles.doneButton}><Text style={styles.doneText}>Xong</Text></Pressable>}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { color: "#475569", fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  button: { alignItems: "flex-start", backgroundColor: "white", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, flex: 1, gap: 4, justifyContent: "center", minHeight: 54, paddingHorizontal: 12 },
  timeButton: { alignItems: "flex-start", backgroundColor: "white", borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, gap: 4, justifyContent: "center", minHeight: 54, paddingHorizontal: 12, width: 110 },
  buttonLabel: { color: "#64748b", fontSize: 11, fontWeight: "700" },
  value: { color: "#172554", fontSize: 14, fontWeight: "600" },
  picker: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  doneButton: { alignItems: "flex-end", padding: 12 },
  doneText: { color: "#1d4ed8", fontWeight: "800" },
});
