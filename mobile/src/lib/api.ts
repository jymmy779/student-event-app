import type {
  ApiResponse,
  EventDetail,
  EventItem,
  EventFormat,
  OrganizerEventItem,
  Registration,
  ScheduledRegistration,
  NoteItem,
} from "./types";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code = "REQUEST_FAILED",
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!configuredUrl)
    throw new ApiRequestError(
      "Chưa cấu hình EXPO_PUBLIC_API_URL trong mobile/.env.",
      "MISSING_API_URL",
    );
  let response: Response;
  try {
    response = await fetch(`${configuredUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });
  } catch {
    throw new ApiRequestError(
      "Không thể kết nối đến máy chủ. Hãy kiểm tra backend và mạng LAN.",
      "NETWORK_ERROR",
    );
  }
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError(
      "Máy chủ trả dữ liệu không hợp lệ.",
      "INVALID_RESPONSE",
    );
  }
  if (!response.ok || body.error) {
    throw new ApiRequestError(
      body.error?.message ?? "Yêu cầu thất bại.",
      body.error?.code,
    );
  }
  return body.data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{
      token: string;
      expiresAt: string;
      user: { id: string; name: string; email: string; role: string };
    }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  signUp: (
    name: string,
    email: string,
    password: string,
    inviteCode?: string,
  ) =>
    request<{
      token: string;
      expiresAt: string;
      user: { id: string; name: string; email: string; role: string };
    }>(inviteCode ? "/auth/register-organizer" : "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        ...(inviteCode ? { inviteCode } : {}),
      }),
    }),
  me: () =>
    request<{ id: string; name: string; email: string; role: string }>(
      "/auth/me",
    ),
  logout: () =>
    request<{ loggedOut: true }>("/auth/logout", { method: "POST" }),
  updateProfile: (input: { name: string; email: string }) =>
    request<{ id: string; name: string; email: string; role: string }>(
      "/me/profile",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    ),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ changed: true }>("/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  myStats: () =>
    request<{
      registered: number;
      checkedIn: number;
      upcoming: number;
      createdEvents: number;
    }>("/me/stats"),
  organizerStats: (id: string) =>
    request<{
      event: { id: string; title: string; capacity: number; remainingSlots: number; qrToken: string };
      registered: number;
      checkedIn: number;
      notCheckedIn: number;
      attendanceRate: number;
    }>(`/organizer/events/${encodeURIComponent(id)}/stats`),
  organizerEvents: () => request<OrganizerEventItem[]>("/organizer/events"),
  setEventVisibility: (id: string, isHidden: boolean) =>
    request<OrganizerEventItem>(
      `/organizer/events/${encodeURIComponent(id)}/visibility`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden }),
      },
    ),
  createEvent: (input: {
    title: string;
    description: string;
    location: string;
    format: EventFormat;
    startsAt: string;
    endsAt: string;
    registrationDeadline: string;
    capacity: number;
  }) =>
    request<OrganizerEventItem & { qrToken: string }>("/organizer/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateEvent: (id: string, input: {
    title: string;
    description: string;
    location: string;
    format: EventFormat;
    startsAt: string;
    endsAt: string;
    registrationDeadline: string;
    capacity: number;
  }) =>
    request<OrganizerEventItem>(`/organizer/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  events: (query = "") =>
    request<EventItem[]>(
      `/events${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    ),
  event: (id: string) =>
    request<EventDetail>(`/events/${encodeURIComponent(id)}`),
  register: (id: string) =>
    request<Registration>(`/events/${encodeURIComponent(id)}/register`, {
      method: "POST",
    }),
  cancelRegistration: (id: string) =>
    request<{ registered: false }>(
      `/events/${encodeURIComponent(id)}/register`,
      { method: "DELETE" },
    ),
  checkIn: (eventId: string, token: string) =>
    request<Registration>(`/events/${encodeURIComponent(eventId)}/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
  registrations: () => request<ScheduledRegistration[]>("/me/registrations"),
  getNote: (eventId: string) =>
    request<NoteItem | null>(`/events/${encodeURIComponent(eventId)}/note`),
  saveNote: (eventId: string, content: string) =>
    request<NoteItem>(`/events/${encodeURIComponent(eventId)}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),
  summarizeNote: (eventId: string) =>
    request<NoteItem>(`/events/${encodeURIComponent(eventId)}/summarize`, {
      method: "POST",
    }),
};
