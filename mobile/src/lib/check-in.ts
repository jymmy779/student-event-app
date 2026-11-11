export const CHECK_IN_SCHEME = "student-event";
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export function getCheckInQrValue(eventId: string, token: string) {
  const baseUrl = configuredApiUrl ? `${configuredApiUrl}/check-in` : `${CHECK_IN_SCHEME}://check-in`;
  return `${baseUrl}?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(token)}`;
}

export function parseCheckInQrValue(value: string) {
  try {
    const parsed = new URL(value);
    const isAppLink = parsed.protocol === `${CHECK_IN_SCHEME}:` && parsed.hostname === "check-in";
    const isWebLink = (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.pathname.endsWith("/check-in");
    if (!isAppLink && !isWebLink) return null;
    const eventId = parsed.searchParams.get("eventId");
    const token = parsed.searchParams.get("token");
    if (!eventId || !token) return null;
    return { eventId, token };
  } catch {
    return null;
  }
}
