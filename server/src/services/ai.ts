export class AiServiceUnavailableError extends Error {
  constructor(
    message = "Dịch vụ AI chưa được cấu hình. Vui lòng cấu hình GEMINI_API_KEY ở máy chủ.",
  ) {
    super(message);
    this.name = "AiServiceUnavailableError";
  }
}

export class AiTimeoutError extends Error {
  constructor(
    message = "Dịch vụ AI phản hồi quá lâu (quá 15 giây). Vui lòng thử lại.",
  ) {
    super(message);
    this.name = "AiTimeoutError";
  }
}

export class AiServiceError extends Error {
  constructor(
    message = "Không thể kết nối đến dịch vụ AI. Vui lòng thử lại.",
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

export async function summarizeContent(
  content: string,
  options?: { apiKey?: string; model?: string; timeoutMs?: number },
): Promise<string> {
  const apiKey = options?.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AiServiceUnavailableError();
  }

  const model =
    options?.model ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
  const timeoutMs = options?.timeoutMs ?? 15000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const prompt = `Bạn là trợ lý học tập cho sinh viên. Hãy đọc ghi chú sự kiện/bài giảng dưới đây và tóm tắt thành các ý chính rõ ràng, súc tích bằng tiếng Việt (khoảng 3 - 5 gạch đầu dòng ngắn gọn, làm nổi bật thông tin quan trọng nhất). Không thêm lời dẫn rườm rà.

Nội dung ghi chú:
${content}`;

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
        signal: controller.signal,
      },
    );
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === "AbortError") {
      throw new AiTimeoutError();
    }
    throw new AiServiceError(
      error instanceof Error ? error.message : "Lỗi kết nối AI.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let errMessage = "Dịch vụ AI phản hồi lỗi.";
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      errMessage = errBody?.error?.message ?? errMessage;
    } catch {
      // ignore json parse error
    }
    throw new AiServiceError(errMessage);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!summary) {
    throw new AiServiceError("Không nhận được nội dung tóm tắt từ AI.");
  }

  return summary;
}
