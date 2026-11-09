import { Router } from "express";
import { prisma } from "../db.js";
import { requireUser } from "../auth.js";
import { publicEventSelect, publicRegistrationSelect } from "../public-select.js";

export const eventsRouter = Router();

eventsRouter.get("/events", async (request, response, next) => {
  try {
    const query =
      typeof request.query.q === "string" ? request.query.q.trim() : "";
    const found = await prisma.event.findMany({
      where: { isHidden: false, ...(query ? { title: { contains: query } } : {}) },
      orderBy: { startsAt: "asc" },
      select: publicEventSelect,
    });
    const now = Date.now();
    const events = [
      ...found.filter((event) => event.endsAt.getTime() > now),
      ...found.filter((event) => event.endsAt.getTime() <= now).sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
    ];
    response.json({ data: events, error: null });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/events/:id", requireUser, async (request, response, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: request.params.id, isHidden: false },
      select: publicEventSelect,
    });

    if (!event) {
      response.status(404).json({
        data: null,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Không tìm thấy sự kiện.",
        },
      });
      return;
    }

    const registration = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: request.user!.id, eventId: event.id } },
      select: publicRegistrationSelect,
    });
    response.json({ data: { ...event, registration }, error: null });
  } catch (error) {
    next(error);
  }
});
