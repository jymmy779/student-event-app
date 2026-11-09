import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = { label: string; value: Date; onChange: (value: Date) => void };
const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DateTimeField({ label, value, onChange }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );
  const [timeDraft, setTimeDraft] = useState(() => formatTime(value));

  useEffect(() => {
    setTimeDraft(formatTime(value));
  }, [value]);

  const firstWeekday =
    (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() +
      6) %
    7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarCells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (calendarCells.length % 7) calendarCells.push(null);
  const monthLabel = visibleMonth.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  function chooseDay(day: number) {
    const next = new Date(value);
    next.setFullYear(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    onChange(next);
    setCalendarOpen(false);
  }

  function changeTime(text: string) {
    setTimeDraft(text);
    const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
    if (!match) return;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return;
    const next = new Date(value);
    next.setHours(hours, minutes, 0, 0);
    onChange(next);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <View style={styles.dateControl}>
          <Text style={styles.controlLabel}>Ngày</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chọn ngày ${label}`}
            onPress={() => setCalendarOpen((open) => !open)}
            style={styles.dateButton}
          >
            <Text style={styles.calendarIcon}>▦</Text>
            <Text style={styles.dateText}>
              {value.toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Text style={styles.chevron}>{calendarOpen ? "⌃" : "⌄"}</Text>
          </Pressable>
        </View>
        <View style={styles.timeControl}>
          <Text style={styles.controlLabel}>Giờ</Text>
          <View style={styles.timeBox}>
            <TextInput
              accessibilityLabel={`Giờ ${label}`}
              value={timeDraft}
              onChangeText={changeTime}
              onBlur={() => setTimeDraft(formatTime(value))}
              maxLength={5}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
              style={styles.timeInput}
            />
          </View>
        </View>
      </View>

      {calendarOpen && (
        <View style={styles.calendar}>
          <View style={styles.monthBar}>
            <Pressable
              accessibilityLabel="Tháng trước"
              onPress={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              style={styles.monthArrow}
            >
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <Pressable
              accessibilityLabel="Tháng sau"
              onPress={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              style={styles.monthArrow}
            >
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {weekdays.map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>
          {Array.from({ length: calendarCells.length / 7 }, (_, row) => (
            <View key={row} style={styles.weekRow}>
              {calendarCells.slice(row * 7, row * 7 + 7).map((day, column) =>
                day ? (
                  <Pressable
                    key={day}
                    onPress={() => chooseDay(day)}
                    style={[
                      styles.dayCell,
                      sameDay(
                        value,
                        new Date(
                          visibleMonth.getFullYear(),
                          visibleMonth.getMonth(),
                          day,
                        ),
                      ) && styles.selectedDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        sameDay(
                          value,
                          new Date(
                            visibleMonth.getFullYear(),
                            visibleMonth.getMonth(),
                            day,
                          ),
                        ) && styles.selectedDayText,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ) : (
                  <View key={`blank-${row}-${column}`} style={styles.dayCell} />
                ),
              )}
            </View>
          ))}
          <Pressable
            onPress={() => {
              const today = new Date();
              setVisibleMonth(
                new Date(today.getFullYear(), today.getMonth(), 1),
              );
              chooseToday(today);
            }}
            style={styles.todayButton}
          >
            <Text style={styles.todayText}>Hôm nay</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  function chooseToday(today: Date) {
    onChange(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        value.getHours(),
        value.getMinutes(),
      ),
    );
    setCalendarOpen(false);
  }
}

function formatTime(value: Date) {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { color: "#475569", fontSize: 12, fontWeight: "700" },
  controls: { flexDirection: "row", gap: 8 },
  dateControl: { flex: 1, gap: 5 },
  timeControl: { gap: 5, width: 102 },
  controlLabel: { color: "#64748b", fontSize: 11, fontWeight: "700" },
  dateButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 10,
  },
  calendarIcon: { color: "#1d4ed8", fontSize: 18 },
  dateText: { color: "#172554", flex: 1, fontSize: 13, fontWeight: "600" },
  chevron: { color: "#64748b", fontSize: 18 },
  timeBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    minHeight: 46,
  },
  clockIcon: { color: "#1d4ed8", fontSize: 18 },
  timeInput: {
    color: "#172554",
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    textAlign: "center",
  },
  calendar: {
    backgroundColor: "white",
    borderColor: "#dbe3f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  monthBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthArrow: {
    alignItems: "center",
    borderRadius: 9,
    height: 34,
    justifyContent: "center",
    width: 38,
  },
  arrowText: { color: "#1d4ed8", fontSize: 27, lineHeight: 30 },
  monthTitle: {
    color: "#172554",
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  weekRow: { flexDirection: "row", justifyContent: "space-around" },
  weekday: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    width: "13.8%",
    paddingVertical: 7,
  },
  dayCell: {
    alignItems: "center",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    marginVertical: 2,
    width: "13.8%",
  },
  dayText: { color: "#334155", fontSize: 13 },
  selectedDay: { backgroundColor: "#1d4ed8" },
  selectedDayText: { color: "white", fontWeight: "800" },
  todayButton: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  todayText: { color: "#1d4ed8", fontSize: 12, fontWeight: "800" },
});
