import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.note.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(() => prisma.$disconnect());

const events = [
  { id: "event-2", title: "Ngày hội việc làm", description: "Mô tả 2", location: "Phòng 2", startsAt: new Date("2026-10-02T01:00:00.000Z"), endsAt: new Date("2026-10-02T02:00:00.000Z"), qrToken: "test-token-2" },
  { id: "event-1", title: "Workshop thuyết trình", description: "Mô tả 1", location: "Phòng 1", startsAt: new Date("2026-10-01T01:00:00.000Z"), endsAt: new Date("2026-10-01T02:00:00.000Z"), qrToken: "test-token-1" },
];

describe("GET /events", () => {
  it("returns real test DB data in the API envelope", async () => {
    await prisma.event.createMany({ data: events });
    const response = await request(app).get("/events").expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toMatchObject({ id: "event-1", title: "Workshop thuyết trình", startsAt: "2026-10-01T01:00:00.000Z" });
    expect(await prisma.event.count()).toBe(2);
  });

  it("returns an empty array when the DB has no events", async () => {
    const response = await request(app).get("/events").expect(200);
    expect(response.body).toEqual({ data: [], error: null });
  });

  it("searches events by title", async () => {
    await prisma.event.createMany({ data: events });
    const response = await request(app).get("/events?q=Workshop").expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe("event-1");
  });
});
