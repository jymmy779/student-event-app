import type { Response } from "express";
import { prisma } from "./db.js";

// Shared demo identity. Never accept userId from request bodies or headers.
export const DEMO_USER = {
  // Kept for the legacy integration-test fixture; seed omits this value so Prisma generates the DB ID.
  id: "cmhr2m9x80000000000000001",
  name: "Sinh viên demo",
  email: "demo@student-events.local",
} as const;

export async function requireDemoUser(response: Response) {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER.email } });
  if (!user) {
    response.status(503).json({
      data: null,
      error: {
        code: "DEMO_USER_NOT_CONFIGURED",
        message: "Chưa có tài khoản demo. Hãy chạy npm run db:seed tại server.",
      },
    });
  }
  return user;
}
