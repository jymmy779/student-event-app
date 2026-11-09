import { createElement, type ChangeEvent } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = { label: string; value: Date; onChange: (value: Date) => void };

const inputStyle = {
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  boxSizing: "border-box" as const,
  color: "#172554",
  fontSize: 14,
  minHeight: 46,
  padding: "10px 12px",
  width: "100%",
};

function localDateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function DateTimeField({ label, value, onChange }: Props) {
  function changeDate(event: ChangeEvent<HTMLInputElement>) {
    const parts = event.currentTarget.value.split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => !part)) return;
    const next = new Date(value);
    next.setFullYear(parts[0], parts[1] - 1, parts[2]);
    onChange(next);
  }

  function changeTime(event: ChangeEvent<HTMLInputElement>) {
    const [hours, minutes] = event.currentTarget.value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
    const next = new Date(value);
    next.setHours(hours, minutes, 0, 0);
    onChange(next);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <View style={styles.dateField}>
          <Text style={styles.subLabel}>Ngày</Text>
          {createElement("input", { "aria-label": `${label} - Ngày`, type: "date", value: localDateValue(value), onChange: changeDate, style: inputStyle })}
        </View>
        <View style={styles.timeField}>
          <Text style={styles.subLabel}>Giờ</Text>
          {createElement("input", { "aria-label": `${label} - Giờ`, type: "time", value: `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`, onChange: changeTime, style: inputStyle })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { color: "#475569", fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  dateField: { flex: 1, gap: 5 },
  timeField: { gap: 5, width: 130 },
  subLabel: { color: "#64748b", fontSize: 11, fontWeight: "700" },
});
