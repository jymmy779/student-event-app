import { useCallback, useEffect, useRef, useState, type ElementRef } from "react";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { formatDate, formatEventFormat } from "@/lib/format";
import type { EventItem } from "@/lib/types";

const MAX_QUESTION_LENGTH = 1000;
const SUGGESTED_QUESTIONS = [
  "Sự kiện này nói về gì?",
  "Sự kiện dành cho những ai?",
  "Mình cần chuẩn bị gì?",
  "Sự kiện diễn ra ở đâu và khi nào?",
];

type Message = { id: string; role: "user" | "assistant"; content: string };

export default function EventQuestionScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const nextMessageId = useRef(0);
  const [lastQuestion, setLastQuestion] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setInitialLoading(true);
      setFetchError(null);
      if (!eventId) {
        setFetchError("Thiếu mã sự kiện.");
        setInitialLoading(false);
        return;
      }
      void api
        .event(eventId)
        .then((data) => {
          if (active) setEvent(data);
        })
        .catch((cause) => {
          if (active)
            setFetchError(
              cause instanceof Error
                ? cause.message
                : "Không thể tải thông tin sự kiện.",
            );
        })
        .finally(() => {
          if (active) setInitialLoading(false);
        });
      return () => {
        active = false;
      };
    }, [eventId, reloadKey]),
  );

  useEffect(() => {
    if (messages.length)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, isAsking]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  async function askQuestion(rawQuestion: string, appendUser = true) {
    const trimmed = rawQuestion.trim();
    if (!eventId || !trimmed || isAsking) return;
    setLastQuestion(trimmed);
    if (appendUser) {
      setMessages((current) => [
        ...current,
        {
          id: `message-${nextMessageId.current++}`,
          role: "user",
          content: trimmed,
        },
      ]);
      setQuestion("");
    }
    setActionError(null);
    setIsAsking(true);
    try {
      const result = await api.askEvent(eventId, trimmed);
      setMessages((current) => [
        ...current,
        {
          id: `message-${nextMessageId.current++}`,
          role: "assistant",
          content: result.answer,
        },
      ]);
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "Không nhận được câu trả lời. Vui lòng thử lại.",
      );
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>
      <Stack.Screen
        options={{
          title: event ? `Hỏi đáp: ${event.title}` : "Hỏi đáp sự kiện",
        }}
      />
      {initialLoading ? (
        <LoadingState label="Đang tải sự kiện..." />
      ) : fetchError ? (
        <ErrorState
          message={fetchError}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <KeyboardAvoidingView
          style={[
            styles.keyboardContainer,
            Platform.OS === "android" && {
              paddingBottom: Math.max(0, keyboardHeight - insets.bottom),
            },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.conversation}
            keyboardShouldPersistTaps="handled"
          >
            {event && (
              <View style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>
                  {formatEventFormat(event.format)} ·{" "}
                  {formatDate(event.startsAt)}
                </Text>
                <Text style={styles.eventMeta}>{event.location}</Text>
              </View>
            )}

            {messages.length === 0 ? (
              <View style={styles.welcomeCard}>
                <View style={styles.sparkle}>
                  <Text style={styles.sparkleText}>✦</Text>
                </View>
                <Text style={styles.welcomeTitle}>
                  Bạn muốn biết gì về sự kiện?
                </Text>
                <Text style={styles.welcomeText}>
                  Hỏi về nội dung, thời gian, địa điểm hoặc cách chuẩn bị. Trợ
                  lý trả lời dựa trên thông tin sự kiện.
                </Text>
                <View style={styles.suggestions}>
                  {SUGGESTED_QUESTIONS.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      accessibilityRole="button"
                      disabled={isAsking}
                      onPress={() => void askQuestion(suggestion)}
                      style={styles.suggestion}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.role === "user" && styles.userMessageRow,
                  ]}
                >
                  {message.role === "assistant" && (
                    <View style={styles.botAvatar}>
                      <Text style={styles.botAvatarText}>✦</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === "user"
                        ? styles.userBubble
                        : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.role === "user" && styles.userMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {isAsking && (
              <View style={styles.messageRow}>
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>✦</Text>
                </View>
                <View
                  style={[
                    styles.messageBubble,
                    styles.assistantBubble,
                    styles.loadingBubble,
                  ]}
                >
                  <ActivityIndicator size="small" color="#1d4ed8" />
                  <Text style={styles.loadingText}>
                    Đang tìm câu trả lời...
                  </Text>
                </View>
              </View>
            )}

            {actionError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{actionError}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={isAsking || !lastQuestion}
                  onPress={() =>
                    void askQuestion(lastQuestion, false)
                  }
                >
                  <Text style={styles.retryText}>Thử lại</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.disclaimer}>
              Câu trả lời dựa trên thông tin ban tổ chức đã cung cấp. Nếu
              thiếu chi tiết, hãy xác nhận với ban tổ chức.
            </Text>
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Nhập câu hỏi về sự kiện"
              value={question}
              onChangeText={setQuestion}
              placeholder="Hỏi về sự kiện này..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={MAX_QUESTION_LENGTH}
              editable={!isAsking}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              onSubmitEditing={() => void askQuestion(question)}
              style={styles.input}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gửi câu hỏi"
              disabled={isAsking || !question.trim()}
              onPress={() => void askQuestion(question)}
              style={[
                styles.sendButton,
                (isAsking || !question.trim()) && styles.sendButtonDisabled,
              ]}
            >
              {isAsking ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>↑</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fb", flex: 1 },
  keyboardContainer: { flex: 1 },
  conversation: { flexGrow: 1, gap: 14, padding: 16, paddingBottom: 20 },
  eventCard: {
    backgroundColor: "#fff",
    borderColor: "#dbe3f0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  eventTitle: { color: "#172554", fontSize: 17, fontWeight: "800" },
  eventMeta: { color: "#64748b", fontSize: 13 },
  welcomeCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#dbe3f0",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  sparkle: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 24,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  sparkleText: { color: "#2563eb", fontSize: 26, fontWeight: "800" },
  welcomeTitle: {
    color: "#172554",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "center",
  },
  welcomeText: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  suggestions: { alignSelf: "stretch", gap: 8, marginTop: 16 },
  suggestion: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: { color: "#334155", fontSize: 13, fontWeight: "600" },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    maxWidth: "94%",
  },
  userMessageRow: { alignSelf: "flex-end" },
  botAvatar: {
    alignItems: "center",
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  botAvatarText: { color: "#1d4ed8", fontSize: 17, fontWeight: "800" },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  assistantBubble: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderBottomLeftRadius: 5,
    flexShrink: 1,
  },
  userBubble: {
    backgroundColor: "#1d4ed8",
    borderBottomRightRadius: 5,
    maxWidth: "88%",
  },
  messageText: { color: "#334155", fontSize: 14, lineHeight: 21 },
  userMessageText: { color: "#fff" },
  loadingBubble: { alignItems: "center", flexDirection: "row", gap: 9 },
  loadingText: { color: "#64748b", fontSize: 13 },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 12,
  },
  errorText: { color: "#b91c1c", flex: 1, fontSize: 13 },
  retryText: { color: "#b91c1c", fontSize: 13, fontWeight: "800", padding: 4 },
  disclaimer: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderColor: "#dbe3f0",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 8,
  },
  input: {
    color: "#0f172a",
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 110,
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 10,
    textAlignVertical: "center",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    borderRadius: 22,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
  },
});
