import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "./db.js";

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;
export type AuthUser = { id: string; name: string; email: string; role: string };
declare global { namespace Express { interface Request { user?: AuthUser } } }

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: createHash("sha256").update(token).digest("hex"), userId, expiresAt } });
  return { token, expiresAt };
}

export async function requireUser(request: Request, response: Response, next: NextFunction) {
  try {
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      response.status(401).json({ data: null, error: { code: "AUTH_REQUIRED", message: "Vui lòng đăng nhập." } });
      return;
    }
    const session = await prisma.session.findUnique({
      where: { id: createHash("sha256").update(token).digest("hex") },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      response.status(401).json({ data: null, error: { code: "SESSION_EXPIRED", message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." } });
      return;
    }
    request.user = session.user;
    next();
  } catch (error) { next(error); }
}

export function requireOrganizer(request: Request, response: Response, next: NextFunction) {
  if (request.user?.role !== "ORGANIZER") {
    response.status(403).json({ data: null, error: { code: "ORGANIZER_REQUIRED", message: "Chức năng chỉ dành cho người tổ chức." } });
    return;
  }
  next();
}
