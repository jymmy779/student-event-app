import { randomBytes } from "node:crypto";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireOrganizer, requireUser } from "../auth.js";
import { publicEventSelect } from "../public-select.js";

export const organizerRouter = Router();

organizerRouter.post("/organizer/events", requireUser, requireOrganizer, async (request, response, next) => {
  try {
    const { title, description, location, format, startsAt, endsAt, registrationDeadline, capacity } = request.body ?? {};
    const start = typeof startsAt === "string" ? new Date(startsAt) : new Date(NaN);
    const end = typeof endsAt === "string" ? new Date(endsAt) : new Date(NaN);
    const deadline = typeof registrationDeadline === "string" ? new Date(registrationDeadline) : new Date(NaN);
    if (typeof title !== "string" || !title.trim() || title.trim().length > 160 ||
        typeof description !== "string" || !description.trim() || description.length > 10000 ||
        typeof location !== "string" || !location.trim() || location.length > 240 ||
        !["IN_PERSON", "ONLINE", "HYBRID"].includes(format) ||
        !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || !Number.isFinite(deadline.getTime()) ||
        start <= new Date() || end <= start || deadline <= new Date() || deadline > start ||
        typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
      response.status(400).json({ data: null, error: { code: "INVALID_EVENT", message: "Nhập thông tin hợp lệ; sự kiện phải bắt đầu trong tương lai, hạn đăng ký không muộn hơn giờ bắt đầu, giờ kết thúc phải sau giờ bắt đầu và số chỗ từ 1 đến 100.000." } });
      return;
    }
    const event = await prisma.event.create({ data: {
      title: title.trim(), description: description.trim(), location: location.trim(), format, startsAt: start, endsAt: end,
      registrationDeadline: deadline, capacity, remainingSlots: capacity,
      qrToken: randomBytes(32).toString("base64url"), createdById: request.user!.id,
    }, select: { ...publicEventSelect, qrToken: true, isHidden: true } });
    response.status(201).json({ data: event, error: null });
  } catch (error) { next(error); }
});

organizerRouter.patch("/organizer/events/:id", requireUser, requireOrganizer, async (request, response, next) => {
  try {
    const id = request.params.id;
    const { title, description, location, format, startsAt, endsAt, registrationDeadline, capacity } = request.body ?? {};
    const start = typeof startsAt === "string" ? new Date(startsAt) : new Date(NaN);
    const end = typeof endsAt === "string" ? new Date(endsAt) : new Date(NaN);
    const deadline = typeof registrationDeadline === "string" ? new Date(registrationDeadline) : new Date(NaN);
    if (typeof id !== "string" || typeof title !== "string" || !title.trim() || title.trim().length > 160 ||
        typeof description !== "string" || !description.trim() || description.length > 10000 ||
        typeof location !== "string" || !location.trim() || location.length > 240 ||
        !["IN_PERSON", "ONLINE", "HYBRID"].includes(format) ||
        !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || !Number.isFinite(deadline.getTime()) ||
        start <= new Date() || end <= start || deadline > start ||
        typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
      response.status(400).json({ data: null, error: { code: "INVALID_EVENT", message: "Thông tin sự kiện không hợp lệ; giờ kết thúc phải sau giờ bắt đầu." } });
      return;
    }
    const owned = await prisma.event.findFirst({ where: { id, createdById: request.user!.id }, select: { id: true } });
    if (!owned) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện của tài khoản này." } });
      return;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const registered = await tx.registration.count({ where: { eventId: id } });
      if (capacity < registered) return { tooSmall: registered };
      const event = await tx.event.update({ where: { id }, data: {
        title: title.trim(), description: description.trim(), location: location.trim(), format,
        startsAt: start, endsAt: end, registrationDeadline: deadline,
        capacity, remainingSlots: capacity - registered,
      }, select: { ...publicEventSelect, isHidden: true } });
      return { event };
    });
    if ("tooSmall" in updated) {
      response.status(409).json({ data: null, error: { code: "CAPACITY_BELOW_REGISTERED", message: `Đã có ${updated.tooSmall} người đăng ký; sức chứa không thể thấp hơn.` } });
      return;
    }
    response.json({ data: updated.event, error: null });
  } catch (error) { next(error); }
});

organizerRouter.get("/organizer/events", requireUser, requireOrganizer, async (request, response, next) => {
  try {
    const events = await prisma.event.findMany({ where: { createdById: request.user!.id }, orderBy: { createdAt: "desc" }, select: { ...publicEventSelect, qrToken: true, isHidden: true } });
    response.json({ data: events, error: null });
  } catch (error) { next(error); }
});

organizerRouter.patch("/organizer/events/:id/visibility", requireUser, requireOrganizer, async (request, response, next) => {
  try {
    const id = request.params.id;
    const { isHidden } = request.body ?? {};
    if (typeof id !== "string" || typeof isHidden !== "boolean") {
      response.status(400).json({ data: null, error: { code: "INVALID_VISIBILITY", message: "Yêu cầu trạng thái ẩn/hiện hợp lệ." } });
      return;
    }
    const owned = await prisma.event.findFirst({ where: { id, createdById: request.user!.id }, select: { id: true } });
    if (!owned) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện của tài khoản này." } });
      return;
    }
    const event = await prisma.event.update({ where: { id }, data: { isHidden }, select: { ...publicEventSelect, isHidden: true } });
    response.json({ data: event, error: null });
  } catch (error) { next(error); }
});

organizerRouter.get("/organizer/events/:id/stats", requireUser, requireOrganizer, async (request, response, next) => {
  try {
    const event = await prisma.event.findFirst({ where: { id: request.params.id, createdById: request.user!.id }, select: { id: true, title: true, capacity: true, remainingSlots: true, qrToken: true } });
    if (!event) {
      response.status(404).json({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện của tài khoản này." } });
      return;
    }
    const [registered, checkedIn] = await Promise.all([
      prisma.registration.count({ where: { eventId: event.id } }),
      prisma.registration.count({ where: { eventId: event.id, checkedInAt: { not: null } } }),
    ]);
    response.json({ data: { event, registered, checkedIn, notCheckedIn: registered - checkedIn, attendanceRate: registered ? checkedIn / registered : 0 }, error: null });
  } catch (error) { next(error); }
});
