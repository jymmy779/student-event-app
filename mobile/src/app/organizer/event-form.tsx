import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DateTimeField } from "@/components/DateTimeField";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { EventFormat } from "@/lib/types";

function defaultStart() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

export default function OrganizerEventFormScreen() {
  const { user } = useAuth();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState<EventFormat>("IN_PERSON");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(() => new Date(defaultStart().getTime() + 60 * 60 * 1000));
  const [registrationDeadline, setRegistrationDeadline] = useState(() => new Date(defaultStart().getTime() - 60 * 60 * 1000));
  const [capacity, setCapacity] = useState("50");
  const [loadingEvent, setLoadingEvent] = useState(!!eventId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    void api.organizerEvents().then((items) => {
      const item = items.find((event) => event.id === eventId);
      if (!active) return;
      if (!item) {
        setError("Không tìm thấy sự kiện hoặc bạn không có quyền chỉnh sửa.");
        return;
      }
      setTitle(item.title);
      setDescription(item.description);
      setLocation(item.location);
      setFormat(item.format);
      setStartsAt(new Date(item.startsAt));
      setEndsAt(new Date(item.endsAt));
      setRegistrationDeadline(new Date(item.registrationDeadline ?? new Date(item.startsAt).getTime() - 60 * 60 * 1000));
      setCapacity(String(item.capacity));
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Không tải được sự kiện.");
    }).finally(() => {
      if (active) setLoadingEvent(false);
    });
    return () => { active = false; };
  }, [eventId]);

  async function save() {
    const now = new Date();
    if (!title.trim() || !description.trim() || !location.trim()) { setError("Hãy nhập tên, mô tả và địa điểm/nền tảng."); return; }
    if (startsAt <= now) { setError("Thời gian bắt đầu phải ở tương lai."); return; }
    if (endsAt <= startsAt) { setError("Thời gian kết thúc phải sau thời gian bắt đầu."); return; }
    if ((!eventId && registrationDeadline <= now) || registrationDeadline > startsAt) { setError("Hạn đăng ký phải ở tương lai và không muộn hơn giờ bắt đầu."); return; }
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) { setError("Sức chứa phải là số nguyên lớn hơn 0."); return; }

    setBusy(true);
    setError("");
    const input = {
      title,
      description,
      location,
      format,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      capacity: Number(capacity),
    };
    try {
      if (eventId) await api.updateEvent(eventId, input);
      else await api.createEvent(input);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được sự kiện.");
    } finally {
      setBusy(false);
    }
  }

  if (user?.role !== "ORGANIZER") return <Redirect href="/explore" />;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}>
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{eventId ? "Chỉnh sửa sự kiện" : "Tạo sự kiện"}</Text>
        <Text style={styles.sub}>Nhập thông tin chương trình và thời gian đăng ký</Text>
      {loadingEvent ? <Text style={styles.sub}>Đang tải sự kiện…</Text> : <View style={styles.card}>
        <Field label="Tên sự kiện" value={title} onChangeText={setTitle} placeholder="Ví dụ: Hội thảo công nghệ" />
        <View style={styles.field}>
          <Text style={styles.label}>Mô tả sự kiện</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Nội dung và thông tin cần biết" multiline style={[styles.input, styles.multiline]} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Hình thức</Text>
          <View style={styles.formatOptions}>
            {([["IN_PERSON", "Trực tiếp"], ["ONLINE", "Trực tuyến"], ["HYBRID", "Kết hợp"]] as const).map(([value, label]) => (
              <Pressable key={value} onPress={() => setFormat(value)} style={[styles.formatOption, format === value && styles.formatOptionSelected]}>
                <Text style={[styles.formatText, format === value && styles.formatTextSelected]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Field
          label={format === "ONLINE" ? "Nền tảng / đường dẫn" : format === "HYBRID" ? "Địa điểm và đường dẫn" : "Địa điểm"}
          value={location}
          onChangeText={setLocation}
          placeholder={format === "ONLINE" ? "Ví dụ: Google Meet" : format === "HYBRID" ? "Ví dụ: Phòng A và Google Meet" : "Ví dụ: Hội trường A"}
        />
        <DateTimeField label="Ngày và giờ bắt đầu" value={startsAt} onChange={setStartsAt} />
        <DateTimeField label="Ngày và giờ kết thúc" value={endsAt} onChange={setEndsAt} />
        <DateTimeField label="Hạn đăng ký" value={registrationDeadline} onChange={setRegistrationDeadline} />
        <Field label="Số người tham gia tối đa" value={capacity} onChangeText={setCapacity} placeholder="Ví dụ: 50" keyboardType="number-pad" />
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={() => void save()} disabled={busy} style={[styles.button, busy && styles.disabled]}>
          <Text style={styles.buttonText}>{busy ? "Đang lưu…" : eventId ? "Lưu thay đổi" : "Tạo sự kiện"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Hủy</Text>
        </Pressable>
      </View>}
    </ScrollView>
    </SafeAreaView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "number-pad" }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{props.label}</Text>
    <TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} keyboardType={props.keyboardType} style={styles.input} />
  </View>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#f5f7fb", flex: 1 },
  page: { backgroundColor: "#f5f7fb", flex: 1 },
  content: { gap: 16, padding: 16, paddingBottom: 32 },
  heading: { color: "#172554", fontSize: 27, fontWeight: "800" },
  sub: { color: "#64748b", fontSize: 14, marginTop: 4 },
  card: { backgroundColor: "white", borderColor: "#dbe3f0", borderRadius: 16, borderWidth: 1, gap: 16, padding: 18 },
  field: { gap: 6 },
  label: { color: "#475569", fontSize: 13, fontWeight: "700" },
  input: { borderColor: "#cbd5e1", borderRadius: 10, borderWidth: 1, color: "#0f172a", fontSize: 15, padding: 12 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  formatOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  formatOption: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderRadius: 9, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  formatOptionSelected: { backgroundColor: "#eff6ff", borderColor: "#1d4ed8" },
  formatText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  formatTextSelected: { color: "#1d4ed8", fontWeight: "800" },
  error: { color: "#b91c1c", lineHeight: 20 },
  button: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 10, padding: 14 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  cancelButton: { alignItems: "center", padding: 10 },
  cancelText: { color: "#475569", fontSize: 14, fontWeight: "700" },
});
