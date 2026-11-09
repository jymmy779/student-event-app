import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import * as aiService from "../src/services/ai.js";

const prisma = new PrismaClient();

const testEvent = {
  id: "event-ai-test",
  title: "Hội thảo Trí tuệ Nhân tạo",
  description: "Mô tả hội thảo AI cho sinh viên",
  location: "Hội trường C",
  startsAt: new Date("2026-11-15T02:00:00.000Z"),
  endsAt: new Date("2026-11-15T05:00:00.000Z"),
  qrToken: "test-ai-token",
};

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.note.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  await prisma.event.create({ data: testEvent });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /events/:id/note", () => {
  it("returns 404 if event does not exist", async () => {
    const res = await request(app).get("/events/non-existent-event/note");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      data: null,
      error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." },
    });
  });

  it("returns null data if user has not created any note for the event", async () => {
    const res = await request(app).get(`/events/${testEvent.id}/note`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: null, error: null });
  });

  it("returns existing note if created", async () => {
    await prisma.user.create({
      data: { id: "user-demo-1", name: "User 1", email: "u1@test.com" },
    });
    await prisma.note.create({
      data: {
        userId: "user-demo-1",
        eventId: testEvent.id,
        content: "Ghi chú ban đầu",
      },
    });

    const res = await request(app).get(`/events/${testEvent.id}/note`);
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({
      userId: "user-demo-1",
      eventId: testEvent.id,
      content: "Ghi chú ban đầu",
      summary: null,
    });
  });
});

describe("PUT /events/:id/note", () => {
  it("rejects empty note or whitespace", async () => {
    const res1 = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "" });
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe("NOTE_EMPTY");

    const res2 = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "    " });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe("NOTE_EMPTY");
  });

  it("rejects note longer than 5000 characters", async () => {
    const longContent = "A".repeat(5001);
    const res = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: longContent });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NOTE_TOO_LONG");
  });

  it("returns 404 if event does not exist", async () => {
    const res = await request(app)
      .put("/events/non-existent-event/note")
      .send({ content: "Ghi chú thử nghiệm" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("EVENT_NOT_FOUND");
  });

  it("saves a valid note and creates record in SQLite", async () => {
    const res = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Nội dung ghi chú bài giảng" });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({
      userId: "user-demo-1",
      eventId: testEvent.id,
      content: "Nội dung ghi chú bài giảng",
      summary: null,
    });

    const inDb = await prisma.note.findFirst({
      where: { eventId: testEvent.id, userId: "user-demo-1" },
    });
    expect(inDb).not.toBeNull();
    expect(inDb?.content).toBe("Nội dung ghi chú bài giảng");
  });

  it("updates existing note when called again (upsert)", async () => {
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Nội dung lần 1" });

    const res = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Nội dung đã cập nhật lần 2" });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe("Nội dung đã cập nhật lần 2");

    const count = await prisma.note.count({
      where: { eventId: testEvent.id, userId: "user-demo-1" },
    });
    expect(count).toBe(1);
  });
});

describe("User Ownership Isolation", () => {
  it("isolates notes between different users on the same event", async () => {
    // User 1 saves note
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .set("x-user-id", "user-1")
      .send({ content: "Ghi chú của User 1" });

    // User 2 saves note
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .set("x-user-id", "user-2")
      .send({ content: "Ghi chú của User 2" });

    // User 1 reads note
    const res1 = await request(app)
      .get(`/events/${testEvent.id}/note`)
      .set("x-user-id", "user-1");
    expect(res1.body.data.content).toBe("Ghi chú của User 1");

    // User 2 reads note
    const res2 = await request(app)
      .get(`/events/${testEvent.id}/note`)
      .set("x-user-id", "user-2");
    expect(res2.body.data.content).toBe("Ghi chú của User 2");

    // User 3 has no note
    const res3 = await request(app)
      .get(`/events/${testEvent.id}/note`)
      .set("x-user-id", "user-3");
    expect(res3.body.data).toBeNull();
  });
});

describe("POST /events/:id/summarize", () => {
  it("returns 400 if user has no note to summarize", async () => {
    const res = await request(app).post(`/events/${testEvent.id}/summarize`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NOTE_EMPTY");
  });

  it("returns 503 AI_SERVICE_UNAVAILABLE when API key is missing", async () => {
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Có ghi chú nhưng thiếu API key" });

    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const res = await request(app).post(`/events/${testEvent.id}/summarize`);
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("AI_SERVICE_UNAVAILABLE");
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("successfully updates summary and preserves note content on AI success", async () => {
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Bài giảng gồm 3 phần chính về AI và ứng dụng di động." });

    const spy = vi
      .spyOn(aiService, "summarizeContent")
      .mockResolvedValue("• Phần 1: Tổng quan AI\n• Phần 2: React Native & AI");

    try {
      const res = await request(app).post(`/events/${testEvent.id}/summarize`);
      expect(res.status).toBe(200);
      expect(res.body.error).toBeNull();
      expect(res.body.data.content).toBe(
        "Bài giảng gồm 3 phần chính về AI và ứng dụng di động.",
      );
      expect(res.body.data.summary).toBe(
        "• Phần 1: Tổng quan AI\n• Phần 2: React Native & AI",
      );

      const dbNote = await prisma.note.findFirst({
        where: { eventId: testEvent.id, userId: "user-demo-1" },
      });
      expect(dbNote?.summary).toBe(
        "• Phần 1: Tổng quan AI\n• Phần 2: React Native & AI",
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("handles AI timeout (504 AI_TIMEOUT) and preserves existing note content in DB", async () => {
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Nội dung quan trọng không được làm mất khi timeout." });

    const spy = vi
      .spyOn(aiService, "summarizeContent")
      .mockRejectedValue(new aiService.AiTimeoutError());

    try {
      const res = await request(app).post(`/events/${testEvent.id}/summarize`);
      expect(res.status).toBe(504);
      expect(res.body.error.code).toBe("AI_TIMEOUT");

      // Verify content is still intact
      const dbNote = await prisma.note.findFirst({
        where: { eventId: testEvent.id, userId: "user-demo-1" },
      });
      expect(dbNote?.content).toBe(
        "Nội dung quan trọng không được làm mất khi timeout.",
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("handles AI service error (503 AI_SERVICE_ERROR) and preserves note in DB", async () => {
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Nội dung ghi chú khi AI gặp lỗi nhà cung cấp." });

    const spy = vi
      .spyOn(aiService, "summarizeContent")
      .mockRejectedValue(new aiService.AiServiceError("Quota exceeded"));

    try {
      const res = await request(app).post(`/events/${testEvent.id}/summarize`);
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("AI_SERVICE_ERROR");
      expect(res.body.error.message).toContain("Quota exceeded");

      const dbNote = await prisma.note.findFirst({
        where: { eventId: testEvent.id, userId: "user-demo-1" },
      });
      expect(dbNote?.content).toBe(
        "Nội dung ghi chú khi AI gặp lỗi nhà cung cấp.",
      );
    } finally {
      spy.mockRestore();
    }
  });
});
