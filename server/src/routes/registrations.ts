import { Prisma } from "@prisma/client";
import { Router, type Response } from "express";
import { prisma } from "../db.js";
import { requireUser } from "../auth.js";
import { publicEventSelect, publicRegistrationSelect } from "../public-select.js";

export const registrationsRouter = Router();

function getEventId(value: unknown, response: Response): string | null {
  const id = value;
  if (typeof id !== "string" || !id) {
    response.status(400).json({ data: null, error: { code: "INVALID_EVENT_ID", message: "Mã sự kiện không hợp lệ." } });
    return null;
  }
  return id;
}

registrationsRouter.post("/events/:id/register", requireUser, async (request, response, next) => {
  try {
    const user = request.user!;
    const eventId = getEventId(request.params.id, response);
    if (!eventId) return;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, endsAt: true, registrationDeadline: true, remainingSlots: true, isHidden: true } });
    if (!event) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });
      return;
    }
    if (event.isHidden) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Sự kiện này hiện không hiển thị." } });
      return;
    }
    const where = { userId_eventId: { userId: user.id, eventId } };
    const existing = await prisma.registration.findUnique({ where, select: publicRegistrationSelect });
    if (existing) {
      response.json({ data: existing, error: null });
      return;
    }
    if (event.endsAt <= new Date()) {
      response.status(409).json({ data: null, error: { code: "EVENT_ENDED", message: "Sự kiện đã hết hạn, không thể đăng ký thêm." } });
      return;
    }
    if (event.registrationDeadline && event.registrationDeadline <= new Date()) {
      response.status(409).json({ data: null, error: { code: "REGISTRATION_CLOSED", message: "Đã qua hạn đăng ký cho sự kiện này." } });
      return;
    }
    if (event.remainingSlots < 1) {
      response.status(409).json({ data: null, error: { code: "EVENT_FULL", message: "Sự kiện đã hết chỗ." } });
      return;
    }
    let registration;
    try {
      registration = await prisma.$transaction(async (tx) => {
        const now = new Date();
        const reserved = await tx.event.updateMany({
          where: { id: eventId, isHidden: false, endsAt: { gt: now }, remainingSlots: { gt: 0 },
            AND: [{ OR: [{ registrationDeadline: null }, { registrationDeadline: { gt: now } }] }] },
          data: { remainingSlots: { decrement: 1 } },
        });
        if (!reserved.count) return null;
        return tx.registration.create({ data: { userId: user.id, eventId }, select: publicRegistrationSelect });
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      registration = await prisma.registration.findUniqueOrThrow({ where, select: publicRegistrationSelect });
    }
    if (!registration) {
      const latest = await prisma.event.findUnique({ where: { id: eventId }, select: { isHidden: true, endsAt: true, registrationDeadline: true } });
      if (!latest || latest.isHidden) {
        response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });
        return;
      }
      const code = latest.endsAt <= new Date() ? "EVENT_ENDED" : latest.registrationDeadline && latest.registrationDeadline <= new Date() ? "REGISTRATION_CLOSED" : "EVENT_FULL";
      const message = code === "EVENT_ENDED" ? "Sự kiện đã hết hạn, không thể đăng ký thêm." : code === "REGISTRATION_CLOSED" ? "Đã qua hạn đăng ký cho sự kiện này." : "Sự kiện đã hết chỗ.";
      response.status(409).json({ data: null, error: { code, message } });
      return;
    }
    response.json({ data: registration, error: null });
  } catch (error) { next(error); }
});

registrationsRouter.delete("/events/:id/register", requireUser, async (request, response, next) => {
  try {
    const user = request.user!;
    const eventId = getEventId(request.params.id, response);
    if (!eventId) return;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });
      return;
    }
    const removed = await prisma.$transaction(async (tx) => {
      const result = await tx.registration.deleteMany({ where: { userId: user.id, eventId, checkedInAt: null } });
      if (result.count) await tx.event.update({ where: { id: eventId }, data: { remainingSlots: { increment: 1 } } });
      return result;
    });
    if (!removed.count) {
      const remaining = await prisma.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId } } });
      if (remaining?.checkedInAt) {
        response.status(409).json({ data: null, error: {
          code: "ALREADY_CHECKED_IN", message: "Bạn đã check-in, không thể hủy đăng ký sự kiện này.",
        } });
        return;
      }
    }
    response.json({ data: { registered: false }, error: null });
  } catch (error) { next(error); }
});

registrationsRouter.get("/me/registrations", requireUser, async (request, response, next) => {
  try {
    const user = request.user!;
    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      orderBy: [{ event: { startsAt: "asc" } }, { eventId: "asc" }],
      select: { ...publicRegistrationSelect, event: { select: publicEventSelect } },
    });
    response.json({ data: registrations, error: null });
  } catch (error) { next(error); }
});
