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
