import type { Request } from "express";

export const DEFAULT_DEMO_USER_ID = "user-demo-1";

export function getCurrentUserId(request: Request): string {
  const headerUserId = request.headers["x-user-id"];
  if (typeof headerUserId === "string" && headerUserId.trim()) {
    return headerUserId.trim();
  }
  return DEFAULT_DEMO_USER_ID;
}
