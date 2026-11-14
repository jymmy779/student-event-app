import { Router } from "express";
import { prisma } from "../db.js";
import { requireUser } from "../auth.js";
import { publicEventSelect, publicRegistrationSelect } from "../public-select.js";

export const eventsRouter = Router();

const VALID_FORMATS = ["IN_PERSON", "ONLINE", "HYBRID"] as const;
const VALID_STATUSES = ["UPCOMING", "ONGOING", "ENDED"] as const;
const VALID_REGISTRATIONS = ["OPEN", "FULL", "CLOSED"] as const;

const INVALID_FILTER_RESPONSE = {
  data: null,
  error: { code: "INVALID_FILTER", message: "Giá trị bộ lọc không hợp lệ." },
};

eventsRouter.get("/events", async (request, response, next) => {
  try {
    const query =
      typeof request.query.q === "string" ? request.query.q.trim() : "";

    // --- Parse & validate filter params ---
    const formatParam = request.query.format;
    const fromParam = request.query.from;
    const toParam = request.query.to;
    const statusParam = request.query.status;
    const registrationParam = request.query.registration;

    if (
      formatParam !== undefined &&
      (typeof formatParam !== "string" ||
        !(VALID_FORMATS as readonly string[]).includes(formatParam))
    ) {
      response.status(400).json(INVALID_FILTER_RESPONSE);
      return;
    }

    if (
      statusParam !== undefined &&
      (typeof statusParam !== "string" ||
        !(VALID_STATUSES as readonly string[]).includes(statusParam))
    ) {
      response.status(400).json(INVALID_FILTER_RESPONSE);
      return;
    }

    if (
      registrationParam !== undefined &&
      (typeof registrationParam !== "string" ||
        !(VALID_REGISTRATIONS as readonly string[]).includes(registrationParam))
    ) {
      response.status(400).json(INVALID_FILTER_RESPONSE);
      return;
    }

    let fromDate: Date | undefined;
    if (fromParam !== undefined) {
      if (typeof fromParam !== "string") {
        response.status(400).json(INVALID_FILTER_RESPONSE);
        return;
      }
      fromDate = new Date(fromParam);
      if (isNaN(fromDate.getTime())) {
        response.status(400).json(INVALID_FILTER_RESPONSE);
        return;
      }
    }

    let toDate: Date | undefined;
    if (toParam !== undefined) {
      if (typeof toParam !== "string") {
        response.status(400).json(INVALID_FILTER_RESPONSE);
        return;
      }
      toDate = new Date(toParam);
      if (isNaN(toDate.getTime())) {
        response.status(400).json(INVALID_FILTER_RESPONSE);
        return;
      }
    }

    // --- Build Prisma where clause ---
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { isHidden: false };

    if (query) {
      where["title"] = { contains: query };
    }

    if (typeof formatParam === "string") {
      if (formatParam === "ONLINE") {
        where["format"] = { in: ["ONLINE", "HYBRID"] };
      } else if (formatParam === "IN_PERSON") {
        where["format"] = { in: ["IN_PERSON", "HYBRID"] };
      } else {
        where["format"] = formatParam;
      }
    }

    if (fromDate) {
      where["startsAt"] = { ...(where["startsAt"] ?? {}), gte: fromDate };
    }

    if (toDate) {
      where["endsAt"] = { ...(where["endsAt"] ?? {}), lte: toDate };
    }

    if (typeof statusParam === "string") {
      if (statusParam === "UPCOMING") {
        where["startsAt"] = { ...(where["startsAt"] ?? {}), gt: now };
      } else if (statusParam === "ONGOING") {
        where["startsAt"] = { ...(where["startsAt"] ?? {}), lte: now };
        where["endsAt"] = { ...(where["endsAt"] ?? {}), gt: now };
      } else if (statusParam === "ENDED") {
        where["endsAt"] = { ...(where["endsAt"] ?? {}), lte: now };
      }
    }

    if (typeof registrationParam === "string") {
      if (registrationParam === "OPEN") {
        // remainingSlots > 0 AND endsAt > now AND (registrationDeadline IS NULL OR registrationDeadline > now)
        where["remainingSlots"] = { ...(where["remainingSlots"] ?? {}), gt: 0 };
        where["endsAt"] = { ...(where["endsAt"] ?? {}), gt: now };
        where["OR"] = [
          { registrationDeadline: null },
          { registrationDeadline: { gt: now } },
        ];
      } else if (registrationParam === "FULL") {
        // remainingSlots <= 0
        where["remainingSlots"] = { ...(where["remainingSlots"] ?? {}), lte: 0 };
      } else if (registrationParam === "CLOSED") {
        // endsAt <= now OR (registrationDeadline IS NOT NULL AND registrationDeadline <= now)
        where["OR"] = [
          { endsAt: { lte: now } },
          {
            AND: [
              { registrationDeadline: { not: null } },
              { registrationDeadline: { lte: now } },
            ],
          },
        ];
      }
    }

    const found = await prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      select: publicEventSelect,
    });

    // Apply ordering: active events (endsAt > now) first ordered asc, then ended events ordered desc
    const nowMs = Date.now();
    const events = [
      ...found.filter((event) => event.endsAt.getTime() > nowMs),
      ...found.filter((event) => event.endsAt.getTime() <= nowMs).sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
    ];

    response.json({ data: events, error: null });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/events/:id", requireUser, async (request, response, next) => {
  try {
    const eventId = request.params["id"];
    const event = await prisma.event.findFirst({
      where: { id: eventId as string, isHidden: false },
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
