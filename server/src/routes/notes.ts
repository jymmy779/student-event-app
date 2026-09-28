import { Router } from "express";
import { prisma } from "../db.js";
import { AiServiceError, summarizeContent } from "../services/ai.js";

export const notesRouter = Router();

// Tài khoản demo cố định của server
const DEMO_USER_ID = "user-demo-student";

// PUT /events/:id/note - Tạo hoặc cập nhật ghi chú sự kiện
notesRouter.put("/events/:id/note", async (request, response, next) => {
  try {
    const eventId = request.params.id;
    const { content } = (request.body ?? {}) as { content?: unknown };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return response.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Không tìm thấy sự kiện." },
      });
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return response.status(400).json({
        data: null,
        error: { code: "INVALID_CONTENT", message: "Nội dung ghi chú không được để trống." },
      });
    }

    if (content.length > 5000) {
      return response.status(400).json({
        data: null,
        error: { code: "CONTENT_TOO_LONG", message: "Nội dung ghi chú không được vượt quá 5.000 ký tự." },
      });
    }

    // Lưu ghi chú theo userId demo của server, không nhận userId từ body
    const note = await prisma.note.upsert({
      where: {
        userId_eventId: {
          userId: DEMO_USER_ID,
          eventId,
        },
      },
      create: {
        userId: DEMO_USER_ID,
        eventId,
        content: content.trim(),
      },
      update: {
        content: content.trim(),
      },
    });

    return response.json({ data: note, error: null });
  } catch (error) {
    next(error);
  }
});

// GET /events/:id/note - Lấy ghi chú và bản tóm tắt của sự kiện
notesRouter.get("/events/:id/note", async (request, response, next) => {
  try {
    const eventId = request.params.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return response.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Không tìm thấy sự kiện." },
      });
    }

    const note = await prisma.note.findUnique({
      where: {
        userId_eventId: {
          userId: DEMO_USER_ID,
          eventId,
        },
      },
    });

    return response.json({ data: note, error: null });
  } catch (error) {
    next(error);
  }
});

// POST /events/:id/summarize - Gọi AI tóm tắt ghi chú và lưu vào DB
notesRouter.post("/events/:id/summarize", async (request, response, next) => {
  try {
    const eventId = request.params.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return response.status(404).json({
        data: null,
        error: { code: "NOT_FOUND", message: "Không tìm thấy sự kiện." },
      });
    }

    const note = await prisma.note.findUnique({
      where: {
        userId_eventId: {
          userId: DEMO_USER_ID,
          eventId,
        },
      },
    });

    if (!note || note.content.trim().length === 0) {
      return response.status(400).json({
        data: null,
        error: { code: "NOTE_EMPTY", message: "Ghi chú trống hoặc chưa tồn tại để tóm tắt." },
      });
    }

    try {
      const summary = await summarizeContent(note.content);

      const updatedNote = await prisma.note.update({
        where: { id: note.id },
        data: { summary },
      });

      return response.json({ data: updatedNote, error: null });
    } catch (aiError) {
      if (aiError instanceof AiServiceError) {
        return response.status(aiError.statusCode).json({
          data: null,
          error: { code: aiError.code, message: aiError.message },
        });
      }

      return response.status(503).json({
        data: null,
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "Dịch vụ AI gặp sự cố hoặc quá thời gian phản hồi. Vui lòng thử lại sau.",
        },
      });
    }
  } catch (error) {
    next(error);
  }
});
