import { createHash } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { hashPassword, requireUser, verifyPassword } from "../auth.js";

export const accountRouter = Router();
const profileSelect = { id: true, name: true, email: true, role: true } as const;

accountRouter.get("/me/stats", requireUser, async (request, response, next) => {
  try {
    const now = new Date();
    const [registered, checkedIn, upcoming, createdEvents] = await Promise.all([
      prisma.registration.count({ where: { userId: request.user!.id } }),
      prisma.registration.count({ where: { userId: request.user!.id, checkedInAt: { not: null } } }),
      prisma.registration.count({ where: { userId: request.user!.id, event: { startsAt: { gt: now } } } }),
      request.user!.role === "ORGANIZER"
        ? prisma.event.count({ where: { createdById: request.user!.id } })
        : Promise.resolve(0),
    ]);
    response.json({ data: { registered, checkedIn, upcoming, createdEvents }, error: null });
  } catch (error) { next(error); }
});

accountRouter.patch("/me/profile", requireUser, async (request, response, next) => {
  try {
    const { name, email } = request.body ?? {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80 ||
        typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      response.status(400).json({ data: null, error: { code: "INVALID_PROFILE", message: "Họ tên (2–80 ký tự) và email hợp lệ là bắt buộc." } });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existing && existing.id !== request.user!.id) {
      response.status(409).json({ data: null, error: { code: "EMAIL_IN_USE", message: "Email này đã được tài khoản khác sử dụng." } });
      return;
    }
    const user = await prisma.user.update({ where: { id: request.user!.id }, data: { name: name.trim(), email: normalizedEmail }, select: profileSelect });
    response.json({ data: user, error: null });
  } catch (error) { next(error); }
});

accountRouter.patch("/me/password", requireUser, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = request.body ?? {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
      response.status(400).json({ data: null, error: { code: "INVALID_PASSWORD", message: "Nhập mật khẩu hiện tại và mật khẩu mới từ 8 đến 128 ký tự." } });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: request.user!.id } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      response.status(401).json({ data: null, error: { code: "CURRENT_PASSWORD_INCORRECT", message: "Mật khẩu hiện tại không đúng." } });
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    const token = request.headers.authorization!.replace(/^Bearer\s+/i, "");
    const currentSessionId = createHash("sha256").update(token).digest("hex");
    await prisma.session.deleteMany({ where: { userId: user.id, id: { not: currentSessionId } } });
    response.json({ data: { changed: true }, error: null });
  } catch (error) { next(error); }
});
