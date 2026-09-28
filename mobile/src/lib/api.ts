import type { ApiResponse, EventItem, NoteItem } from "./types";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

export class ApiRequestError extends Error {
  constructor(message: string, public readonly code = "REQUEST_FAILED") {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!configuredUrl) throw new ApiRequestError("Chưa cấu hình EXPO_PUBLIC_API_URL trong mobile/.env.", "MISSING_API_URL");
  let response: Response;
  try {
    response = await fetch(`${configuredUrl.replace(/\/$/, "")}${path}`, init);
  } catch {
    throw new ApiRequestError("Không thể kết nối đến máy chủ. Hãy kiểm tra backend và mạng LAN.", "NETWORK_ERROR");
  }
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError("Máy chủ trả dữ liệu không hợp lệ.", "INVALID_RESPONSE");
  }
  if (!response.ok || body.error) {
    throw new ApiRequestError(body.error?.message ?? "Yêu cầu thất bại.", body.error?.code);
  }
  return body.data as T;
}

export const api = {
  events: (query = "") => request<EventItem[]>(`/events${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  getNote: (eventId: string) => request<NoteItem | null>(`/events/${eventId}/note`),
  saveNote: (eventId: string, content: string) =>
    request<NoteItem>(`/events/${eventId}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),
  summarizeNote: (eventId: string) =>
    request<NoteItem>(`/events/${eventId}/summarize`, {
      method: "POST",
    }),
};
