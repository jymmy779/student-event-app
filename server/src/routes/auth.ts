import { createHash } from "node:crypto";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { prisma } from "../db.js";
import {
  createSession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "../auth.js";

export const authRouter = Router();
const userSelect = { id: true, name: true, email: true, role: true } as const;

async function register(
  request: Request,
  response: Response,
  next: NextFunction,
  role: "STUDENT" | "ORGANIZER",
) {
  try {
    const { name, email, password, inviteCode } = request.body ?? {};
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      response
        .status(400)
        .json({
          data: null,
          error: {
            code: "INVALID_INPUT",
            message: "Họ tên, email hợp lệ và mật khẩu từ 8 ký tự là bắt buộc.",
          },
        });
      return;
    }
    if (
      role === "ORGANIZER" &&
      (!process.env.ORGANIZER_INVITE_CODE ||
        inviteCode !== process.env.ORGANIZER_INVITE_CODE)
    ) {
      response
        .status(403)
        .json({
          data: null,
          error: {
            code: "INVALID_INVITE",
            message: "Mã mời người tổ chức không hợp lệ.",
          },
        });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (
      await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })
    ) {
      response
        .status(409)
        .json({
          data: null,
          error: {
            code: "EMAIL_IN_USE",
            message: "Email này đã được đăng ký.",
          },
        });
      return;
    }
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role,
      },
      select: userSelect,
    });
    const session = await createSession(user.id);
    response.status(201).json({ data: { user, ...session }, error: null });
  } catch (error) {
    next(error);
  }
}

authRouter.post(
  "/auth/register",
  (req, res, next) => void register(req, res, next, "STUDENT"),
);
authRouter.post(
  "/auth/register-organizer",
  (req, res, next) => void register(req, res, next, "ORGANIZER"),
);
authRouter.post("/auth/login", async (request, response, next) => {
  try {
    const { email, password } = request.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      response
        .status(400)
        .json({
          data: null,
          error: {
            code: "INVALID_INPUT",
            message: "Email và mật khẩu là bắt buộc.",
          },
        });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      response
        .status(401)
        .json({
          data: null,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email hoặc mật khẩu không đúng.",
          },
        });
      return;
    }
    const session = await createSession(user.id);
    response.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ...session,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});
authRouter.get("/auth/me", requireUser, (request, response) =>
  response.json({ data: request.user, error: null }),
);
authRouter.post(
  "/auth/logout",
  requireUser,
  async (request, response, next) => {
    try {
      const token = request.headers.authorization!.replace(/^Bearer\s+/i, "");
      await prisma.session.deleteMany({
        where: { id: createHash("sha256").update(token).digest("hex") },
      });
      response.json({ data: { loggedOut: true }, error: null });
    } catch (error) {
      next(error);
    }
  },
);
