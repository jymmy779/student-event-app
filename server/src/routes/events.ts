import { Router } from "express";
import { prisma } from "../db.js";

export const eventsRouter = Router();

eventsRouter.get("/events", async (request, response, next) => {
  try {
    const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const events = await prisma.event.findMany({
      where: query ? { title: { contains: query } } : undefined,
      orderBy: { startsAt: "asc" },
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
    });
    if (!event) {
      return response.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Không tìm thấy sự kiện." },
      });
    }
    response.json({ data: event, error: null });
  } catch (error) {
    next(error);
  }
});

