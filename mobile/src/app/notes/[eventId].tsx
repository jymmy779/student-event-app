import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EventItem, NoteItem } from "@/lib/types";

const MAX_NOTE_LENGTH = 5000;

export default function NoteScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventId: string; eventTitle?: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [note, setNote] = useState<NoteItem | null>(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<"save" | "summarize" | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!eventId) return;
      let active = true;
      const requestVersion = reloadKey;

      async function load() {
        setIsLoading(true);
        setLoadError(null);
        try {
          const [eventData, noteData] = await Promise.all([
            api.getEvent(eventId).catch(() => null),
            api.getNote(eventId),
          ]);

          if (active && requestVersion === reloadKey) {
            if (eventData) {
              setEvent(eventData);
            }
            if (noteData) {
              setNote(noteData);
              setContent(noteData.content);
              setSavedContent(noteData.content);
              setSummary(noteData.summary);
            }
          }
        } catch (caught) {
          if (active) {
            setLoadError(caught instanceof Error ? caught.message : "Không thể tải ghi chú.");
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      }

      void load();
      return () => {
        active = false;
      };
    }, [eventId, reloadKey])
  );

  // Tự động ẩn thông báo thành công sau 3 giây
  useEffect(() => {
    if (!successNotice) return;
    const timer = setTimeout(() => setSuccessNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [successNotice]);

  const isBusy = isSaving || isSummarizing;
  const isOverLimit = content.length > MAX_NOTE_LENGTH;
  const isContentEmpty = content.trim().length === 0;
  const hasUnsavedChanges = content.trim() !== savedContent.trim();

  // Xử lý lưu ghi chú
  const handleSaveNote = async () => {
    if (!eventId || isBusy) return;

    if (isContentEmpty) {
      setActionError("Nội dung ghi chú không được để trống.");
      setLastFailedAction("save");
      return;
    }

    if (isOverLimit) {
      setActionError(`Nội dung ghi chú không được vượt quá ${MAX_NOTE_LENGTH.toLocaleString()} ký tự.`);
      setLastFailedAction("save");
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setLastFailedAction(null);
    setSuccessNotice(null);

    try {
      const updatedNote = await api.saveNote(eventId, content.trim());
      setNote(updatedNote);
      setSavedContent(updatedNote.content);
      setContent(updatedNote.content);
      setSuccessNotice("Đã lưu ghi chú thành công!");
    } catch (caught) {
      // GIỮ NGUYÊN NỘI DUNG GHI CHÚ, KHÔNG LÀM MẤT CHỮ
      setActionError(caught instanceof Error ? caught.message : "Lỗi khi lưu ghi chú.");
      setLastFailedAction("save");
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý tóm tắt bằng AI
  const handleSummarize = async () => {
    if (!eventId || isBusy) return;

    if (isContentEmpty) {
      setActionError("Vui lòng nhập nội dung ghi chú trước khi yêu cầu AI tóm tắt.");
      setLastFailedAction("summarize");
      return;
    }

    if (isOverLimit) {
      setActionError(`Nội dung ghi chú vượt quá giới hạn ${MAX_NOTE_LENGTH.toLocaleString()} ký tự.`);
      setLastFailedAction("summarize");
      return;
    }

    setIsSummarizing(true);
    setActionError(null);
    setLastFailedAction(null);
    setSuccessNotice(null);

    try {
      // Nếu có nội dung mới chưa lưu, tự động lưu note trước khi gọi summarize
      if (hasUnsavedChanges) {
        const saved = await api.saveNote(eventId, content.trim());
        setSavedContent(saved.content);
        setNote(saved);
      }

      // Gọi endpoint summarize
      const summarizedNote = await api.summarizeNote(eventId);
      setNote(summarizedNote);
      setSummary(summarizedNote.summary);
      setSuccessNotice("AI đã hoàn thành tóm tắt ghi chú!");
    } catch (caught) {
      // GIỮ NGUYÊN NỘI DUNG GHI CHÚ NGƯỜI DÙNG ĐÃ NHẬP
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Dịch vụ AI gặp sự cố hoặc quá thời gian phản hồi. Vui lòng thử lại sau."
      );
      setLastFailedAction("summarize");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Nút thử lại khi xảy ra lỗi
  const handleRetry = () => {
    if (lastFailedAction === "save") {
      void handleSaveNote();
    } else {
      void handleSummarize();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <LoadingState label="Đang tải ghi chú sự kiện…" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.screen}>
        <ErrorState message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      </View>
    );
  }

  const displayTitle = event?.title || params.eventTitle || "Ghi chú sự kiện";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header thông tin sự kiện */}
        <View style={styles.eventHeaderCard}>
          <View style={styles.badgeRow}>
            <View style={styles.endedBadge}>
              <Text style={styles.endedBadgeText}>Sự kiện đã kết thúc</Text>
            </View>
            {note?.updatedAt && (
              <Text style={styles.lastUpdatedText}>
                Cập nhật: {formatDate(note.updatedAt)}
              </Text>
            )}
          </View>

          <Text style={styles.eventTitle}>{displayTitle}</Text>

          {event && (
            <View style={styles.eventMetaRow}>
              <Text style={styles.eventMeta}>📅 {formatDate(event.startsAt)}</Text>
              <Text style={styles.eventMeta}>📍 {event.location}</Text>
            </View>
          )}
        </View>

        {/* Thông báo thành công nếu có */}
        {successNotice && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>✓ {successNotice}</Text>
          </View>
        )}

        {/* Banner Lỗi và Nút Thử Lại (Error & Retry) */}
        {actionError && (
          <View style={styles.errorBanner}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>
                {lastFailedAction === "save" ? "Không thể lưu ghi chú" : "Không thể tóm tắt bằng AI"}
              </Text>
            </View>
            <Text style={styles.errorMessage}>{actionError}</Text>
            <Text style={styles.errorHint}>
              Nội dung ghi chú của bạn vẫn được giữ nguyên an toàn bên dưới.
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              onPress={handleRetry}
              style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.retryButtonText}>🔄 Thử lại ngay</Text>
            </Pressable>
          </View>
        )}

        {/* Khung trạng thái Loading khi AI đang xử lý */}
        {isSummarizing && (
          <View style={styles.aiLoadingCard}>
            <ActivityIndicator size="small" color="#6366f1" />
            <View style={styles.aiLoadingContent}>
              <Text style={styles.aiLoadingTitle}>AI đang phân tích và tóm tắt ghi chú…</Text>
              <Text style={styles.aiLoadingSub}>
                Hệ thống đang trích xuất các ý chính quan trọng, vui lòng chờ trong giây lát.
              </Text>
            </View>
          </View>
        )}

        {/* Form nhập nội dung ghi chú */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📝 Ghi chú của bạn</Text>
            <Text
              style={[
                styles.charCounter,
                isOverLimit && styles.charCounterOver,
              ]}
            >
              {content.length.toLocaleString()}/{MAX_NOTE_LENGTH.toLocaleString()}
            </Text>
          </View>

          <Text style={styles.inputGuide}>
            Ghi lại những ý quan trọng, bài học hoặc nội dung bạn tâm đắc trong sự kiện này.
          </Text>

          <TextInput
            accessibilityLabel="Nội dung ghi chú sự kiện"
            editable={!isBusy}
            maxLength={MAX_NOTE_LENGTH + 500}
            multiline
            numberOfLines={8}
            onChangeText={(text) => {
              setContent(text);
              if (actionError) setActionError(null);
            }}
            placeholder="Nhập ghi chú của bạn tại đây (tối đa 5.000 ký tự)…"
            placeholderTextColor="#94a3b8"
            style={[
              styles.textInput,
              isOverLimit && styles.textInputOverLimit,
              isBusy && styles.textInputDisabled,
            ]}
            textAlignVertical="top"
            value={content}
          />

          {isOverLimit && (
            <Text style={styles.warningText}>
              Ghi chú đang vượt quá {MAX_NOTE_LENGTH.toLocaleString()} ký tự. Vui lòng rút gọn trước khi lưu.
            </Text>
          )}

          {/* Hàng nút hành động: Lưu ghi chú & Tóm tắt AI */}
          <View style={styles.actionButtonsRow}>
            {/* Nút Lưu ghi chú */}
            <Pressable
              accessibilityRole="button"
              disabled={isBusy || isContentEmpty || isOverLimit}
              onPress={handleSaveNote}
              style={({ pressed }) => [
                styles.saveButton,
                (isBusy || isContentEmpty || isOverLimit) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {isSaving ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.saveButtonText}>Đang lưu…</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>
                  💾 {hasUnsavedChanges ? "Lưu thay đổi" : "Lưu ghi chú"}
                </Text>
              )}
            </Pressable>

            {/* Nút Tóm tắt bằng AI */}
            <Pressable
              accessibilityRole="button"
              disabled={isBusy || isContentEmpty || isOverLimit}
              onPress={handleSummarize}
              style={({ pressed }) => [
                styles.summarizeButton,
                (isBusy || isContentEmpty || isOverLimit) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {isSummarizing ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.summarizeButtonText}>Đang tóm tắt…</Text>
                </View>
              ) : (
                <Text style={styles.summarizeButtonText}>
                  ✨ {summary ? "Tóm tắt lại bằng AI" : "Tóm tắt bằng AI"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Khối hiển thị kết quả tóm tắt AI hoặc Empty State */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🤖 Bản tóm tắt AI</Text>
            {summary && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI Powered</Text>
              </View>
            )}
          </View>

          {summary ? (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{summary}</Text>
              <View style={styles.summaryFooter}>
                <Text style={styles.summaryHint}>
                  💡 Bản tóm tắt được trích xuất tự động từ ghi chú của bạn. Bạn có thể bổ sung ghi chú và nhấn &quot;Tóm tắt lại bằng AI&quot; bất cứ lúc nào.
                </Text>
              </View>
            </View>
          ) : (
            // Trạng thái trống khi chưa có bản tóm tắt (Empty State)
            <View style={styles.summaryEmptyState}>
              <Text style={styles.summaryEmptyIcon}>💡</Text>
              <Text style={styles.summaryEmptyTitle}>Chưa có bản tóm tắt AI</Text>
              <Text style={styles.summaryEmptyMessage}>
                Sau khi nhập nội dung ghi chú, nhấn nút &quot;Tóm tắt bằng AI&quot; ở trên để nhận bản tóm tắt súc tích và dễ nhớ từ hệ thống.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f5f7fb",
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  eventHeaderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  endedBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  endedBadgeText: {
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
  },
  lastUpdatedText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  eventTitle: {
    color: "#1e293b",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  eventMetaRow: {
    marginTop: 10,
    gap: 4,
  },
  eventMeta: {
    color: "#64748b",
    fontSize: 13,
  },
  successBanner: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successBannerText: {
    color: "#065f46",
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorTitle: {
    color: "#991b1b",
    fontSize: 15,
    fontWeight: "700",
  },
  errorMessage: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
  },
  errorHint: {
    color: "#7f1d1d",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  retryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  aiLoadingCard: {
    backgroundColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiLoadingContent: {
    flex: 1,
  },
  aiLoadingTitle: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "700",
  },
  aiLoadingSub: {
    color: "#6366f1",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionTitle: {
    color: "#1e293b",
    fontSize: 17,
    fontWeight: "700",
  },
  charCounter: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  charCounterOver: {
    color: "#ef4444",
    fontWeight: "700",
  },
  inputGuide: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 22,
    minHeight: 180,
    maxHeight: 280,
    padding: 14,
  },
  textInputOverLimit: {
    borderColor: "#ef4444",
    backgroundColor: "#fff5f5",
  },
  textInputDisabled: {
    opacity: 0.7,
    backgroundColor: "#f1f5f9",
  },
  warningText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  summarizeButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    flex: 1.2,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summarizeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  aiBadge: {
    backgroundColor: "#ede9fe",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiBadgeText: {
    color: "#6d28d9",
    fontSize: 11,
    fontWeight: "700",
  },
  summaryContainer: {
    backgroundColor: "#faf5ff",
    borderColor: "#f3e8ff",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryText: {
    color: "#1e1b4b",
    fontSize: 15,
    lineHeight: 24,
  },
  summaryFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9d5ff",
  },
  summaryHint: {
    color: "#6b21a8",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  summaryEmptyState: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  summaryEmptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryEmptyTitle: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryEmptyMessage: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 320,
  },
});
