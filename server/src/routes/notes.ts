import { Router } from "express";
import { getCurrentUserId } from "../auth.js";
import { prisma } from "../db.js";
import {
  AiServiceError,
  AiServiceUnavailableError,
  AiTimeoutError,
  summarizeContent,
} from "../services/ai.js";

export const notesRouter = Router();

const noteSelect = {
  id: true,
  userId: true,
  eventId: true,
  content: true,
  summary: true,
  updatedAt: true,
} as const;

notesRouter.get("/events/:id/note", async (request, response, next) => {
  try {
    const eventId = request.params.id;
    const userId = getCurrentUserId(request);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      response.status(404).json({
        data: null,
        error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." },
      });
      return;
    }

    const note = await prisma.note.findUnique({
      where: { userId_eventId: { userId, eventId } },
      select: noteSelect,
    });

    response.json({ data: note, error: null });
  } catch (error) {
    next(error);
  }
});

notesRouter.put("/events/:id/note", async (request, response, next) => {
  try {
    const eventId = request.params.id;
    const userId = getCurrentUserId(request);
    const content = request.body?.content;

    if (typeof content !== "string" || !content.trim()) {
      response.status(400).json({
        data: null,
        error: {
          code: "NOTE_EMPTY",
          message: "Nội dung ghi chú không được để trống.",
        },
      });
      return;
    }

    if (content.length > 5000) {
      response.status(400).json({
        data: null,
        error: {
          code: "NOTE_TOO_LONG",
          message: "Nội dung ghi chú không được vượt quá 5.000 ký tự.",
        },
      });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      response.status(404).json({
        data: null,
        error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." },
      });
      return;
    }

    // Đảm bảo user tồn tại trước khi liên kết
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "Sinh viên Demo",
        email: `${userId}@student.edu.vn`,
      },
    });

    const note = await prisma.note.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: { content: content.trim() },
      create: { userId, eventId, content: content.trim() },
      select: noteSelect,
    });

    response.json({ data: note, error: null });
  } catch (error) {
    next(error);
  }
});

notesRouter.post("/events/:id/summarize", async (request, response, next) => {
  try {
    const eventId = request.params.id;
    const userId = getCurrentUserId(request);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      response.status(404).json({
        data: null,
        error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." },
      });
      return;
    }

    const note = await prisma.note.findUnique({
      where: { userId_eventId: { userId, eventId } },
      select: noteSelect,
    });

    if (!note || !note.content.trim()) {
      response.status(400).json({
        data: null,
        error: {
          code: "NOTE_EMPTY",
          message: "Chưa có nội dung ghi chú để tóm tắt.",
        },
      });
      return;
    }

    try {
      const summary = await summarizeContent(note.content);
      const updatedNote = await prisma.note.update({
        where: { id: note.id },
        data: { summary },
        select: noteSelect,
      });

      response.json({ data: updatedNote, error: null });
    } catch (aiError) {
      if (aiError instanceof AiServiceUnavailableError) {
        response.status(503).json({
          data: null,
          error: {
            code: "AI_SERVICE_UNAVAILABLE",
            message: aiError.message,
          },
        });
        return;
      }

      if (aiError instanceof AiTimeoutError) {
        response.status(504).json({
          data: null,
          error: {
            code: "AI_TIMEOUT",
            message: aiError.message,
          },
        });
        return;
      }

      response.status(503).json({
        data: null,
        error: {
          code: "AI_SERVICE_ERROR",
          message:
            aiError instanceof Error
              ? aiError.message
              : "Dịch vụ AI gặp lỗi. Vui lòng thử lại.",
        },
      });
    }
  } catch (error) {
    next(error);
  }
});
