export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

export function eventStatus(startsAt: string, endsAt: string, checkedInAt: string | null) {
  if (checkedInAt) return "Đã check-in";
  if (new Date(endsAt).getTime() < Date.now()) return "Đã kết thúc";
  if (new Date(startsAt).getTime() > Date.now()) return "Sắp diễn ra";
  return "Đang diễn ra";
}
