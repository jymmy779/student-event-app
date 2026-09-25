import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { DEMO_USER_ID } from "../demoUser.js";

export const eventsRouter = Router();

function eventData<T extends { registrations: { checkedInAt: Date | null }[] }>(event: T) {
  const { registrations, ...data } = event;
  const registration = registrations[0] ?? null;
  return {
    ...data,
    registration: registration ? { isRegistered: true, checkedInAt: registration.checkedInAt } : { isRegistered: false, checkedInAt: null },
  };
}

eventsRouter.get("/events", async (request, response, next) => {
  try {
    const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const events = await prisma.event.findMany({
      where: query ? { title: { contains: query } } : undefined,
      orderBy: { startsAt: "asc" },
      include: { registrations: { where: { userId: DEMO_USER_ID }, select: { checkedInAt: true } } },
    });
    response.json({ data: events.map(eventData), error: null });
  } catch (error) { next(error); }
});

eventsRouter.get("/events/:id", async (request, response, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: request.params.id },
      include: { registrations: { where: { userId: DEMO_USER_ID }, select: { checkedInAt: true } } },
    });
    if (!event) return response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });
    response.json({ data: eventData(event), error: null });
  } catch (error) { next(error); }
});

eventsRouter.post("/events/:id/register", async (request, response, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: request.params.id }, select: { id: true } });
    if (!event) return response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });

    const registration = await prisma.registration.upsert({
      where: { userId_eventId: { userId: DEMO_USER_ID, eventId: event.id } },
      update: {},
      create: { userId: DEMO_USER_ID, eventId: event.id },
    });
    response.json({ data: registration, error: null });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const registration = await prisma.registration.findUnique({ where: { userId_eventId: { userId: DEMO_USER_ID, eventId: request.params.id } } });
      return response.json({ data: registration, error: null });
    }
    next(error);
  }
});

eventsRouter.delete("/events/:id/register", async (request, response, next) => {
  try {
    const registration = await prisma.registration.findUnique({ where: { userId_eventId: { userId: DEMO_USER_ID, eventId: request.params.id } } });
    if (!registration) return response.status(404).json({ data: null, error: { code: "REGISTRATION_NOT_FOUND", message: "Bạn chưa đăng ký sự kiện này." } });
    if (registration.checkedInAt) return response.status(409).json({ data: null, error: { code: "ALREADY_CHECKED_IN", message: "Không thể hủy sau khi đã check-in." } });
    await prisma.registration.delete({ where: { id: registration.id } });
    response.json({ data: { eventId: request.params.id, isRegistered: false }, error: null });
  } catch (error) { next(error); }
});

eventsRouter.get("/me/registrations", async (_request, response, next) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { event: { startsAt: "asc" } },
      include: { event: true },
    });
    response.json({ data: registrations, error: null });
  } catch (error) { next(error); }
});
