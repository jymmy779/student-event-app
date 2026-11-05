import { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireDemoUser } from "../demo-user.js";
import { publicEventSelect, publicRegistrationSelect } from "../public-select.js";

export const registrationsRouter = Router();

registrationsRouter.post("/events/:id/register", async (request, response, next) => {
  try {
    const user = await requireDemoUser(response);
    if (!user) return;
    const eventId = request.params.id;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });
      return;
    }
    const where = { userId_eventId: { userId: user.id, eventId } };
    // Upsert preserves both the registration ID and checkedInAt on retries.
    let registration;
    try {
      registration = await prisma.registration.upsert({
        where, update: {}, create: { userId: user.id, eventId }, select: publicRegistrationSelect,
      });
    } catch (error) {
      // A concurrent first registration may win the unique constraint race.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      registration = await prisma.registration.findUniqueOrThrow({ where, select: publicRegistrationSelect });
    }
    response.json({ data: registration, error: null });
  } catch (error) { next(error); }
});

registrationsRouter.delete("/events/:id/register", async (request, response, next) => {
  try {
    const user = await requireDemoUser(response);
    if (!user) return;
    const eventId = request.params.id;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });
      return;
    }
    // Check-in guard is part of the DELETE itself, not a stale read before it.
    const removed = await prisma.registration.deleteMany({ where: { userId: user.id, eventId, checkedInAt: null } });
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

registrationsRouter.get("/me/registrations", async (_request, response, next) => {
  try {
    const user = await requireDemoUser(response);
    if (!user) return;
    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      orderBy: [{ event: { startsAt: "asc" } }, { eventId: "asc" }],
      select: { ...publicRegistrationSelect, event: { select: publicEventSelect } },
    });
    response.json({ data: registrations, error: null });
  } catch (error) { next(error); }
});
