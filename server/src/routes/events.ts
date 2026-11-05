import { Router } from "express";
import { prisma } from "../db.js";
import { DEMO_USER } from "../demo-user.js";
import { publicEventSelect, publicRegistrationSelect } from "../public-select.js";

export const eventsRouter = Router();

eventsRouter.get("/events", async (request, response, next) => {
  try {
    const query =
      typeof request.query.q === "string" ? request.query.q.trim() : "";
    const events = await prisma.event.findMany({
      where: query ? { title: { contains: query } } : undefined,
      orderBy: { startsAt: "asc" },
      select: publicEventSelect,
    });
    response.json({ data: events, error: null });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/events/:id", async (request, response, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: request.params.id },
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
      where: { userId_eventId: { userId: DEMO_USER.id, eventId: event.id } },
      select: publicRegistrationSelect,
    });
    response.json({ data: { ...event, registration }, error: null });
  } catch (error) {
    next(error);
  }
});
