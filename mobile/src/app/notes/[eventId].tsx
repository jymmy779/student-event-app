import { useCallback, useState } from "react";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api, ApiRequestError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EventItem, NoteItem } from "@/lib/types";

const MAX_CHARACTERS = 5000;

export default function EventNoteScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [note, setNote] = useState<NoteItem | null>(null);
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestVersion = reloadKey;

      async function load() {
        if (!eventId) {
          setFetchError("Thiếu mã sự kiện.");
          setInitialLoading(false);
          return;
        }

        setInitialLoading(true);
        setFetchError(null);
        try {
          const [eventData, noteData] = await Promise.all([
            api.event(eventId),
            api.getNote(eventId),
          ]);
          if (active && requestVersion === reloadKey) {
            setEvent(eventData);
            setNote(noteData);
            if (noteData) {
              setContent(noteData.content);
              setSummary(noteData.summary);
            }
          }
        } catch (caught) {
          if (active) {
            setFetchError(
              caught instanceof Error
                ? caught.message
                : "Không thể tải thông tin ghi chú.",
            );
          }
        } finally {
          if (active) setInitialLoading(false);
        }
      }

      void load();
      return () => {
        active = false;
      };
    }, [eventId, reloadKey]),
  );

  async function handleSaveNote() {
    if (!eventId || !content.trim() || isSaving || isSummarizing) return;
    setIsSaving(true);
    setActionError(null);
    setSaveSuccessMsg(null);

    try {
      const savedNote = await api.saveNote(eventId, content);
      setNote(savedNote);
      setSummary(savedNote.summary);
      setSaveSuccessMsg("Đã lưu ghi chú thành công!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Không thể lưu ghi chú. Vui lòng thử lại.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSummarize() {
    if (!eventId || !content.trim() || isSaving || isSummarizing) return;
    setIsSummarizing(true);
    setActionError(null);
    setSaveSuccessMsg(null);

    try {
      // Tự động lưu note mới nhất trước khi tóm tắt nếu nội dung có thay đổi
      if (!note || note.content !== content.trim()) {
        await api.saveNote(eventId, content);
      }
      const summarized = await api.summarizeNote(eventId);
      setNote(summarized);
      setSummary(summarized.summary);
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Không thể tóm tắt nội dung. Vui lòng thử lại.",
      );
    } finally {
      setIsSummarizing(false);
    }
  }

  const isBusy = isSaving || isSummarizing;
  const isContentEmpty = !content.trim();
  const isTooLong = content.length > MAX_CHARACTERS;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <Stack.Screen
        options={{
          title: event ? `Ghi chú: ${event.title}` : "Ghi chú & Tóm tắt AI",
        }}
      />

      {initialLoading ? (
        <LoadingState label="Đang tải ghi chú..." />
      ) : fetchError ? (
        <ErrorState
          message={fetchError}
          onRetry={() => setReloadKey((v) => v + 1)}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header thông tin sự kiện */}
            {event ? (
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventSub}>
                  {event.location} • {formatDate(event.startsAt)}
                </Text>
              </View>
            ) : null}

            {/* Thông báo kết quả thao tác */}
            {saveSuccessMsg ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✓ {saveSuccessMsg}</Text>
              </View>
            ) : null}

            {actionError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {actionError}</Text>
                <Pressable
                  onPress={handleSummarize}
                  style={styles.retryBtnInline}
                  disabled={isBusy || isContentEmpty}
                >
                  <Text style={styles.retryBtnInlineText}>Thử lại</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Khung nhập ghi chú */}
            <View style={styles.editorCard}>
              <View style={styles.editorHeader}>
                <Text style={styles.editorLabel}>NỘI DUNG GHI CHÚ</Text>
                <Text
                  style={[
                    styles.charCounter,
                    isTooLong && styles.charCounterLimit,
                  ]}
                >
                  {content.length}/{MAX_CHARACTERS}
                </Text>
              </View>

              <TextInput
                multiline
                placeholder="Ghi lại các ý chính, câu hỏi hoặc kiến thức quan trọng trong sự kiện..."
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
                maxLength={MAX_CHARACTERS + 100}
                editable={!isBusy}
              />

              <View style={styles.editorActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lưu ghi chú"
                  disabled={isBusy || isContentEmpty || isTooLong}
                  onPress={handleSaveNote}
                  style={({ pressed }) => [
                    styles.saveButton,
                    (isBusy || isContentEmpty || isTooLong) &&
                      styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Lưu ghi chú</Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tóm tắt bằng AI"
                  disabled={isBusy || isContentEmpty || isTooLong}
                  onPress={handleSummarize}
                  style={({ pressed }) => [
                    styles.aiButton,
                    (isBusy || isContentEmpty || isTooLong) &&
                      styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {isSummarizing ? (
                    <View style={styles.aiBtnLoading}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.aiButtonText}>Đang tóm tắt…</Text>
                    </View>
                  ) : (
                    <Text style={styles.aiButtonText}>✨ Tóm tắt bằng AI</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Khung hiển thị Tóm tắt AI */}
            {summary ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryBadgeRow}>
                  <View style={styles.summaryBadge}>
                    <Text style={styles.summaryBadgeText}>✨ TÓM TẮT BỞI AI</Text>
                  </View>
                  {note?.updatedAt ? (
                    <Text style={styles.summaryDate}>
                      {formatDate(note.updatedAt)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.summaryContent}>{summary}</Text>
              </View>
            ) : (
              <View style={styles.emptySummaryCard}>
                <Text style={styles.emptySummaryIcon}>💡</Text>
                <Text style={styles.emptySummaryTitle}>Chưa có bản tóm tắt</Text>
                <Text style={styles.emptySummaryDesc}>
                  Nhập nội dung ghi chú ở trên và bấm &quot;Tóm tắt bằng AI&quot; để Gemini
                  tự động cô đọng các ý chính cho bạn.
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 },
  keyboardContainer: { flex: 1 },
  contentContainer: { padding: 18, paddingBottom: 40 },
  eventHeader: {
    backgroundColor: "#fff",
    borderRadius: 14,
    elevation: 1,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  eventTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  eventSub: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
  },
  successBanner: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  successText: {
    color: "#065f46",
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#b91c1c",
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtnInline: {
    backgroundColor: "#ef4444",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryBtnInlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  editorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    padding: 16,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  editorHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  editorLabel: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  charCounter: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  charCounterLimit: {
    color: "#ef4444",
    fontWeight: "700",
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 22,
    minHeight: 150,
    padding: 14,
  },
  editorActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  aiButton: {
    alignItems: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    flex: 1.2,
    height: 44,
    justifyContent: "center",
  },
  aiBtnLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  summaryCard: {
    backgroundColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    marginTop: 20,
    padding: 18,
    shadowColor: "#6d28d9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  summaryBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryBadge: {
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryBadgeText: {
    color: "#6d28d9",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  summaryDate: {
    color: "#8b5cf6",
    fontSize: 12,
  },
  summaryContent: {
    color: "#2e1065",
    fontSize: 15,
    lineHeight: 24,
  },
  emptySummaryCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1.5,
    marginTop: 20,
    padding: 24,
  },
  emptySummaryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptySummaryTitle: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySummaryDesc: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
