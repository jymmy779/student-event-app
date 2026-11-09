import type { EventFormat } from "./types";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

export function formatEventFormat(value: EventFormat) {
  return value === "ONLINE" ? "Trực tuyến" : value === "HYBRID" ? "Kết hợp" : "Trực tiếp";
}

export function getEventStatus(event: { startsAt: string; endsAt: string; createdAt: string }) {
  const now = Date.now();
  const startsAt = new Date(event.startsAt).getTime();
  const endsAt = new Date(event.endsAt).getTime();
  if (endsAt <= now) return "expired" as const;
  if (startsAt <= now) return "ongoing" as const;
  const createdAt = new Date(event.createdAt).getTime();
  if (createdAt <= now && now - createdAt <= 7 * 24 * 60 * 60 * 1000) return "new" as const;
  return null;
}
