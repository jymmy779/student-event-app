export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 503,
    public readonly code: string = "AI_SERVICE_UNAVAILABLE"
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

export interface SummarizeOptions {
  apiKey?: string;
  provider?: "gemini" | "openai" | "anthropic";
  timeoutMs?: number;
}

export async function summarizeContent(
  content: string,
  options: SummarizeOptions = {}
): Promise<string> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new AiServiceError("Nội dung ghi chú trống, không thể tóm tắt.", 400, "INVALID_CONTENT");
  }

  // Chế độ mô phỏng demo (cho dev/test khi được bật rõ ràng bằng env MOCK_AI)
  if (process.env.MOCK_AI === "true") {
    const preview = trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
    return `[CHẾ ĐỘ DEMO] Tóm tắt nội dung ghi chú sự kiện:\n- Các ý chính ghi nhận: ${preview}\n- Lưu ý quan trọng: Vui lòng xem chi tiết nội dung sự kiện để nắm rõ lịch trình.`;
  }

  const geminiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const openaiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const anthropicKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  const genericKey = options.apiKey ?? process.env.AI_API_KEY;

  let provider = options.provider ?? (process.env.AI_PROVIDER?.toLowerCase() as SummarizeOptions["provider"]);
  let activeKey = "";

  if (geminiKey) {
    provider = provider ?? "gemini";
    activeKey = geminiKey;
  } else if (openaiKey) {
    provider = provider ?? "openai";
    activeKey = openaiKey;
  } else if (anthropicKey) {
    provider = provider ?? "anthropic";
    activeKey = anthropicKey;
  } else if (genericKey) {
    activeKey = genericKey;
    if (!provider) {
      if (genericKey.startsWith("AIza")) provider = "gemini";
      else if (genericKey.startsWith("sk-ant-")) provider = "anthropic";
      else if (genericKey.startsWith("sk-")) provider = "openai";
      else provider = "gemini";
    }
  }

  // Trường hợp server chưa cấu hình API key
  if (!activeKey) {
    throw new AiServiceError(
      "[CHẾ ĐỘ DEMO] Máy chủ chưa cấu hình API key AI. Dịch vụ tóm tắt hiện chưa khả dụng.",
      503,
      "DEMO_MODE_NO_API_KEY"
    );
  }

  const timeoutMs = options.timeoutMs ?? Number(process.env.AI_TIMEOUT_MS ?? 15000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (provider === "gemini") {
      const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Bạn là trợ lý học tập cho sinh viên. Hãy tóm tắt nội dung ghi chú sau đây một cách ngắn gọn, mạch lạc, làm nổi bật các ý chính và hành động cần nhớ:\n\n${trimmed}`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new AiServiceError(
          `Dịch vụ AI (Gemini) phản hồi lỗi (HTTP ${response.status}). Vui lòng thử lại sau.`,
          503,
          "AI_SERVICE_UNAVAILABLE"
        );
      }

      const json = (await response.json()) as any;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== "string") {
        throw new AiServiceError(
          "Dịch vụ AI không trả về nội dung tóm tắt hợp lệ.",
          503,
          "AI_SERVICE_UNAVAILABLE"
        );
      }
      return text.trim();
    }

    if (provider === "openai") {
      const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      const url = "https://api.openai.com/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Bạn là trợ lý học tập cho sinh viên. Hãy tóm tắt nội dung ghi chú sau đây một cách ngắn gọn, mạch lạc, làm nổi bật các ý chính và hành động cần nhớ.",
            },
            { role: "user", content: trimmed },
          ],
        }),
      });

      if (!response.ok) {
        throw new AiServiceError(
          `Dịch vụ AI (OpenAI) phản hồi lỗi (HTTP ${response.status}). Vui lòng thử lại sau.`,
          503,
          "AI_SERVICE_UNAVAILABLE"
        );
      }

      const json = (await response.json()) as any;
      const text = json.choices?.[0]?.message?.content;
      if (!text || typeof text !== "string") {
        throw new AiServiceError(
          "Dịch vụ AI không trả về nội dung tóm tắt hợp lệ.",
          503,
          "AI_SERVICE_UNAVAILABLE"
        );
      }
      return text.trim();
    }

    if (provider === "anthropic") {
      const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";
      const url = "https://api.anthropic.com/v1/messages";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": activeKey,
          "anthropic-version": "2023-06-01",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Bạn là trợ lý học tập cho sinh viên. Hãy tóm tắt nội dung ghi chú sau đây một cách ngắn gọn, mạch lạc, làm nổi bật các ý chính và hành động cần nhớ:\n\n${trimmed}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new AiServiceError(
          `Dịch vụ AI (Anthropic) phản hồi lỗi (HTTP ${response.status}). Vui lòng thử lại sau.`,
          503,
          "AI_SERVICE_UNAVAILABLE"
        );
      }

      const json = (await response.json()) as any;
      const text = json.content?.[0]?.text;
      if (!text || typeof text !== "string") {
        throw new AiServiceError(
          "Dịch vụ AI không trả về nội dung tóm tắt hợp lệ.",
          503,
          "AI_SERVICE_UNAVAILABLE"
        );
      }
      return text.trim();
    }

    throw new AiServiceError(
      "Nhà cung cấp AI không được hỗ trợ.",
      503,
      "AI_SERVICE_UNAVAILABLE"
    );
  } catch (error: any) {
    if (error instanceof AiServiceError) throw error;
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new AiServiceError(
        "Dịch vụ AI quá thời gian phản hồi (timeout). Vui lòng thử lại sau.",
        503,
        "AI_TIMEOUT"
      );
    }
    throw new AiServiceError(
      "Không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra kết nối mạng và thử lại.",
      503,
      "AI_SERVICE_UNAVAILABLE"
    );
  } finally {
    clearTimeout(timer);
  }
}
