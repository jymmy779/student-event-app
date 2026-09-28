import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";

const prisma = new PrismaClient();

const DEMO_USER = {
  id: "user-demo-student",
  name: "Sinh viên Demo",
  email: "demo@student.university.edu.vn",
};

const testEvent = {
  id: "event-note-test",
  title: "Sự kiện kiểm thử ghi chú",
  description: "Mô tả sự kiện kiểm thử",
  location: "Hội trường B",
  startsAt: new Date("2026-10-01T08:00:00.000Z"),
  endsAt: new Date("2026-10-01T11:00:00.000Z"),
  qrToken: "test-note-event-token",
};

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.note.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Khởi tạo người dùng demo và sự kiện kiểm thử
  await prisma.user.create({ data: DEMO_USER });
  await prisma.event.create({ data: testEvent });

  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.AI_API_KEY;
  delete process.env.MOCK_AI;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PUT /events/:id/note", () => {
  it("creates a new note successfully with valid content", async () => {
    const response = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Ghi chú buổi hội thảo rất hữu ích, có nhiều kiến thức hay." })
      .expect(200);

    expect(response.body.error).toBeNull();
    expect(response.body.data).toMatchObject({
      eventId: testEvent.id,
      userId: DEMO_USER.id,
      content: "Ghi chú buổi hội thảo rất hữu ích, có nhiều kiến thức hay.",
      summary: null,
    });

    const dbNote = await prisma.note.findUnique({
      where: { userId_eventId: { userId: DEMO_USER.id, eventId: testEvent.id } },
    });
    expect(dbNote).not.toBeNull();
    expect(dbNote?.content).toBe("Ghi chú buổi hội thảo rất hữu ích, có nhiều kiến thức hay.");
  });

  it("updates existing note content without creating duplicate", async () => {
    // Tạo note ban đầu
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Nội dung ban đầu" })
      .expect(200);

    // Cập nhật note
    const response = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Nội dung cập nhật mới" })
      .expect(200);

    expect(response.body.data.content).toBe("Nội dung cập nhật mới");

    const count = await prisma.note.count({
      where: { userId: DEMO_USER.id, eventId: testEvent.id },
    });
    expect(count).toBe(1);
  });

  it("rejects empty or whitespace-only content with 400 INVALID_CONTENT", async () => {
    const resEmpty = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "" })
      .expect(400);

    expect(resEmpty.body.data).toBeNull();
    expect(resEmpty.body.error).toMatchObject({
      code: "INVALID_CONTENT",
    });

    const resSpaces = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "    \n   " })
      .expect(400);

    expect(resSpaces.body.data).toBeNull();
    expect(resSpaces.body.error).toMatchObject({
      code: "INVALID_CONTENT",
    });
  });

  it("rejects content exceeding 5000 characters with 400 CONTENT_TOO_LONG", async () => {
    const longContent = "A".repeat(5001);
    const response = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: longContent })
      .expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({
      code: "CONTENT_TOO_LONG",
    });
  });

  it("returns 404 NOT_FOUND if event does not exist", async () => {
    const response = await request(app)
      .put("/events/non-existent-event/note")
      .send({ content: "Ghi chú hợp lệ" })
      .expect(404);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("ignores arbitrary userId from body and uses fixed server demo identity", async () => {
    const hackerUserId = "fake-injected-user-id";
    const response = await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({
        content: "Ghi chú bảo mật",
        userId: hackerUserId,
      })
      .expect(200);

    expect(response.body.data.userId).toBe(DEMO_USER.id);

    // Không tồn tại note với fake user id
    const hackerNote = await prisma.note.findFirst({
      where: { userId: hackerUserId },
    });
    expect(hackerNote).toBeNull();
  });
});

describe("GET /events/:id/note", () => {
  it("returns null data when note does not exist yet", async () => {
    const response = await request(app)
      .get(`/events/${testEvent.id}/note`)
      .expect(200);

    expect(response.body.error).toBeNull();
    expect(response.body.data).toBeNull();
  });

  it("returns saved note and summary", async () => {
    // Tạo note có sẵn summary trong DB
    await prisma.note.create({
      data: {
        userId: DEMO_USER.id,
        eventId: testEvent.id,
        content: "Nội dung ghi chú đầy đủ",
        summary: "Bản tóm tắt ý chính của hội thảo",
      },
    });

    const response = await request(app)
      .get(`/events/${testEvent.id}/note`)
      .expect(200);

    expect(response.body.error).toBeNull();
    expect(response.body.data).toMatchObject({
      userId: DEMO_USER.id,
      eventId: testEvent.id,
      content: "Nội dung ghi chú đầy đủ",
      summary: "Bản tóm tắt ý chính của hội thảo",
    });
  });

  it("returns 404 NOT_FOUND when event does not exist", async () => {
    const response = await request(app)
      .get("/events/unknown-event/note")
      .expect(404);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("POST /events/:id/summarize", () => {
  it("returns 404 NOT_FOUND when event does not exist", async () => {
    const response = await request(app)
      .post("/events/unknown-event/summarize")
      .expect(404);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns 400 NOTE_EMPTY when no note exists for the event", async () => {
    const response = await request(app)
      .post(`/events/${testEvent.id}/summarize`)
      .expect(400);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({
      code: "NOTE_EMPTY",
    });
  });

  it("returns 503 with clear DEMO MODE label when server has no API key configured and does not generate fake summary", async () => {
    // Tạo note trước
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Học phần Mobile App rất thú vị." })
      .expect(200);

    // Chưa cấu hình API key
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    delete process.env.MOCK_AI;

    const response = await request(app)
      .post(`/events/${testEvent.id}/summarize`)
      .expect(503);

    expect(response.body.data).toBeNull();
    expect(response.body.error).toMatchObject({
      code: "DEMO_MODE_NO_API_KEY",
    });
    expect(response.body.error.message).toContain("[CHẾ ĐỘ DEMO]");

    // Xác nhận tuyệt đối không lưu summary giả vào DB khi chưa có key/gặp lỗi
    const dbNote = await prisma.note.findUnique({
      where: { userId_eventId: { userId: DEMO_USER.id, eventId: testEvent.id } },
    });
    expect(dbNote?.summary).toBeNull();
  });

  it("saves summary and returns 200 when AI summarize succeeds (via MOCK_AI demo mode)", async () => {
    // Tạo note
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Buổi chia sẻ về kiến trúc Clean Architecture trong mobile app." })
      .expect(200);

    // Kích hoạt chế độ mô phỏng AI
    process.env.MOCK_AI = "true";

    const response = await request(app)
      .post(`/events/${testEvent.id}/summarize`)
      .expect(200);

    expect(response.body.error).toBeNull();
    expect(response.body.data.summary).toContain("[CHẾ ĐỘ DEMO]");

    // Kiểm tra trong DB đã được cập nhật summary
    const dbNote = await prisma.note.findUnique({
      where: { userId_eventId: { userId: DEMO_USER.id, eventId: testEvent.id } },
    });
    expect(dbNote?.summary).toBe(response.body.data.summary);
  });

  it("returns 503 when AI service responds with an error (e.g. 500) and does not update summary in DB", async () => {
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Ghi chú kiểm tra lỗi AI 500" })
      .expect(200);

    process.env.GEMINI_API_KEY = "dummy-key-for-test";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Internal Error", { status: 500, statusText: "Internal Server Error" })
    );

    const response = await request(app)
      .post(`/events/${testEvent.id}/summarize`)
      .expect(503);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("AI_SERVICE_UNAVAILABLE");

    // Đảm bảo không sinh dữ liệu tóm tắt giả trong DB
    const dbNote = await prisma.note.findUnique({
      where: { userId_eventId: { userId: DEMO_USER.id, eventId: testEvent.id } },
    });
    expect(dbNote?.summary).toBeNull();

    fetchSpy.mockRestore();
  });

  it("returns 503 when AI service times out and does not update summary in DB", async () => {
    await request(app)
      .put(`/events/${testEvent.id}/note`)
      .send({ content: "Ghi chú kiểm tra lỗi timeout" })
      .expect(200);

    process.env.GEMINI_API_KEY = "dummy-key-for-test";
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(abortErr);

    const response = await request(app)
      .post(`/events/${testEvent.id}/summarize`)
      .expect(503);

    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("AI_TIMEOUT");

    // Đảm bảo không sinh dữ liệu tóm tắt giả trong DB
    const dbNote = await prisma.note.findUnique({
      where: { userId_eventId: { userId: DEMO_USER.id, eventId: testEvent.id } },
    });
    expect(dbNote?.summary).toBeNull();

    fetchSpy.mockRestore();
  });
});
