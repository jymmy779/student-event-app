import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { DEMO_USER_ID } from "../src/demoUser.js";

const prisma = new PrismaClient();
beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.note.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});
afterAll(() => prisma.$disconnect());

describe("GET /events", () => {
  it("returns real test DB data in the API envelope", async () => {
    await prisma.event.createMany({ data: [
      { id: "event-2", title: "Sự kiện sau", description: "Mô tả 2", location: "Phòng 2", startsAt: new Date("2026-10-02T01:00:00.000Z"), endsAt: new Date("2026-10-02T02:00:00.000Z"), qrToken: "test-token-2" },
      { id: "event-1", title: "Sự kiện trước", description: "Mô tả 1", location: "Phòng 1", startsAt: new Date("2026-10-01T01:00:00.000Z"), endsAt: new Date("2026-10-01T02:00:00.000Z"), qrToken: "test-token-1" },
    ] });
    const response = await request(app).get("/events").expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toMatchObject({ id: "event-1", title: "Sự kiện trước", startsAt: "2026-10-01T01:00:00.000Z" });
    expect(await prisma.event.count()).toBe(2);
  });

  it("returns an empty array when the DB has no events", async () => {
    const response = await request(app).get("/events").expect(200);
    expect(response.body).toEqual({ data: [], error: null });
    expect(await prisma.event.count()).toBe(0);
  });
});

async function seedMilestoneOne() {
  await prisma.user.createMany({ data: [
    { id: DEMO_USER_ID, name: "Demo", email: "demo@test.local" },
    { id: "other-user", name: "Other", email: "other@test.local" },
  ] });
  await prisma.event.createMany({ data: [
    { id: "workshop", title: "Workshop thuyết trình", description: "Mô tả workshop", location: "A1", startsAt: new Date("2026-10-01T01:00:00.000Z"), endsAt: new Date("2026-10-01T02:00:00.000Z"), qrToken: "workshop-token" },
    { id: "career-day", title: "Ngày hội việc làm", description: "Mô tả nghề nghiệp", location: "A2", startsAt: new Date("2026-10-02T01:00:00.000Z"), endsAt: new Date("2026-10-02T02:00:00.000Z"), qrToken: "career-token" },
  ] });
}

describe("milestone 1 event and registration APIs", () => {
  it("searches events by title", async () => {
    await seedMilestoneOne();
    const response = await request(app).get("/events?q=Workshop").expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({ id: "workshop", registration: { isRegistered: false, checkedInAt: null } });
  });

  it("returns a structured 404 for an unknown event", async () => {
    await seedMilestoneOne();
    const response = await request(app).get("/events/missing").expect(404);
    expect(response.body).toEqual({ data: null, error: { code: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." } });
  });

  it("registers idempotently and keeps one database row", async () => {
    await seedMilestoneOne();
    const first = await request(app).post("/events/workshop/register").expect(200);
    const second = await request(app).post("/events/workshop/register").expect(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(await prisma.registration.count({ where: { userId: DEMO_USER_ID, eventId: "workshop" } })).toBe(1);
  });

  it("cancels a registration that has not checked in", async () => {
    await seedMilestoneOne();
    await request(app).post("/events/workshop/register").expect(200);
    const response = await request(app).delete("/events/workshop/register").expect(200);
    expect(response.body).toEqual({ data: { eventId: "workshop", isRegistered: false }, error: null });
    expect(await prisma.registration.count()).toBe(0);
  });

  it("blocks cancellation after check-in and preserves the row", async () => {
    await seedMilestoneOne();
    await prisma.registration.create({ data: { userId: DEMO_USER_ID, eventId: "workshop", checkedInAt: new Date("2026-10-01T01:15:00.000Z") } });
    const response = await request(app).delete("/events/workshop/register").expect(409);
    expect(response.body.error.code).toBe("ALREADY_CHECKED_IN");
    expect(await prisma.registration.count()).toBe(1);
  });

  it("returns only the fixed demo user's persisted schedule", async () => {
    await seedMilestoneOne();
    await prisma.registration.createMany({ data: [
      { userId: DEMO_USER_ID, eventId: "career-day" },
      { userId: "other-user", eventId: "workshop" },
    ] });
    const response = await request(app).get("/me/registrations").expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({ userId: DEMO_USER_ID, eventId: "career-day", event: { title: "Ngày hội việc làm" } });
    expect(await prisma.registration.count()).toBe(2);
  });
});
