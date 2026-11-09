import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma as apiPrisma } from "../src/db.js";
import { DEMO_USER } from "../src/demo-user.js";

const prisma = new PrismaClient();
const event = {
  id: "registration-event", title: "Seminar", description: "Mô tả", location: "Phòng A",
  startsAt: new Date("2026-12-01T01:00:00Z"), endsAt: new Date("2026-12-01T03:00:00Z"), qrToken: "private-test-token",
};
const endpoint = `/events/${event.id}/register`;

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.note.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.create({ data: DEMO_USER });
  await prisma.event.create({ data: event });
});
afterAll(async () => { await prisma.$disconnect(); await apiPrisma.$disconnect(); });

describe("registration and personal schedule", () => {
  it("persists a registration and exposes the same state in detail and schedule", async () => {
    const before = await request(app).get(`/events/${event.id}`).expect(200);
    expect(before.body.data.registration).toBeNull();
    const response = await request(app).post(endpoint).expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toMatchObject({ eventId: event.id, checkedInAt: null });
    const stored = await prisma.registration.findUniqueOrThrow({ where: { id: response.body.data.id } });
    expect(stored.userId).toBe(DEMO_USER.id);
    const detail = await request(app).get(`/events/${event.id}`).expect(200);
    expect(detail.body.data.registration).toEqual(response.body.data);
    const schedule = await request(app).get("/me/registrations").expect(200);
    expect(schedule.body.data).toHaveLength(1);
    expect(schedule.body.data[0]).toMatchObject({ ...response.body.data, event: { id: event.id } });
    expect(schedule.body.data[0].event).not.toHaveProperty("qrToken");
    expect(schedule.body.data[0]).not.toHaveProperty("user");
  });

  it("repeated registration preserves ID, creation time and checked-in state", async () => {
    const first = await request(app).post(endpoint).expect(200);
    const checkedInAt = new Date("2026-12-01T01:10:00Z");
    await prisma.registration.update({ where: { id: first.body.data.id }, data: { checkedInAt } });
    const second = await request(app).post(endpoint).expect(200);
    expect(second.body.data).toEqual({ ...first.body.data, checkedInAt: checkedInAt.toISOString() });
    expect(await prisma.registration.count()).toBe(1);
  });

  it("concurrent registration creates exactly one row", async () => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => request(app).post(endpoint)));
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200]);
    expect(new Set(responses.map((response) => response.body.data.id)).size).toBe(1);
    expect(await prisma.registration.count()).toBe(1);
  });

  it("database uniqueness rejects a second user-event pair directly", async () => {
    await request(app).post(endpoint).expect(200);
    await expect(prisma.registration.create({ data: { userId: DEMO_USER.id, eventId: event.id } })).rejects.toMatchObject({ code: "P2002" });
  });

  it("cancels an unchecked registration, clears detail and schedule, and allows re-registration", async () => {
    await request(app).post(endpoint).expect(200);
    const response = await request(app).delete(endpoint).expect(200);
    expect(response.body).toEqual({ data: { registered: false }, error: null });
    expect(await prisma.registration.count()).toBe(0);
    expect((await request(app).get("/me/registrations").expect(200)).body.data).toEqual([]);
    expect((await request(app).get(`/events/${event.id}`).expect(200)).body.data.registration).toBeNull();
    await request(app).post(endpoint).expect(200);
    expect(await prisma.registration.count()).toBe(1);
  });

  it("cancelling an absent registration is idempotent", async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      expect((await request(app).delete(endpoint).expect(200)).body.data).toEqual({ registered: false });
    }
    expect(await prisma.registration.count()).toBe(0);
  });

  it("refuses cancellation after check-in and retains persisted state", async () => {
    const checkedInAt = new Date("2026-12-01T01:10:00Z");
    const stored = await prisma.registration.create({ data: { userId: DEMO_USER.id, eventId: event.id, checkedInAt } });
    const response = await request(app).delete(endpoint).expect(409);
    expect(response.body).toMatchObject({ data: null, error: { code: "ALREADY_CHECKED_IN" } });
    expect(await prisma.registration.findUnique({ where: { id: stored.id } })).toEqual(stored);
    expect((await request(app).get("/me/registrations").expect(200)).body.data[0].checkedInAt).toBe(checkedInAt.toISOString());
  });

  it("returns 404 for registration and cancellation on an unknown event", async () => {
    for (const method of ["post", "delete"] as const) {
      const response = await request(app)[method]("/events/missing/register").expect(404);
      expect(response.body).toMatchObject({ data: null, error: { code: "EVENT_NOT_FOUND" } });
    }
    expect(await prisma.registration.count()).toBe(0);
  });

  it("has an empty schedule before registration", async () => {
    expect((await request(app).get("/me/registrations").expect(200)).body).toEqual({ data: [], error: null });
  });

  it("ignores spoofed identity and never reads or deletes another user's registration", async () => {
    const other = await prisma.user.create({ data: { id: "other", name: "Other", email: "other@test.local" } });
    const otherRegistration = await prisma.registration.create({ data: { userId: other.id, eventId: event.id } });
    expect((await request(app).get("/me/registrations").set("x-user-id", other.id).query({ userId: other.id }).expect(200)).body.data).toEqual([]);
    expect((await request(app).get(`/events/${event.id}`).expect(200)).body.data.registration).toBeNull();
    await request(app).post(endpoint).set("x-user-id", other.id).send({ userId: other.id }).expect(200);
    expect(await prisma.registration.count({ where: { userId: DEMO_USER.id } })).toBe(1);
    await request(app).delete(endpoint).send({ userId: other.id }).expect(200);
    expect(await prisma.registration.findUnique({ where: { id: otherRegistration.id } })).toEqual(otherRegistration);
    expect(await prisma.registration.count()).toBe(1);
  });

  it("sorts personal events by start time", async () => {
    await prisma.event.create({ data: { ...event, id: "earlier", qrToken: "earlier-token", startsAt: new Date("2026-11-01T01:00:00Z") } });
    await request(app).post(endpoint).expect(200);
    await request(app).post("/events/earlier/register").expect(200);
    const response = await request(app).get("/me/registrations").expect(200);
    expect(response.body.data.map((item: { eventId: string }) => item.eventId)).toEqual(["earlier", event.id]);
  });

  it("retains registration after disconnect and reload from an independent DB client", async () => {
    const response = await request(app).post(endpoint).expect(200);
    await apiPrisma.$disconnect();
    await prisma.$disconnect();
    const fresh = new PrismaClient();
    try {
      expect(await fresh.registration.findUnique({ where: { id: response.body.data.id } })).toMatchObject({ userId: DEMO_USER.id, eventId: event.id });
      const schedule = await request(app).get("/me/registrations").expect(200);
      expect(schedule.body.data[0].id).toBe(response.body.data.id);
    } finally { await fresh.$disconnect(); }
  });

  it("reports missing demo setup without accepting a caller-supplied user", async () => {
    await prisma.user.delete({ where: { id: DEMO_USER.id } });
    for (const method of ["post", "delete"] as const) {
      const response = await request(app)[method](endpoint).send({ userId: "other" }).expect(503);
      expect(response.body.error.code).toBe("DEMO_USER_NOT_CONFIGURED");
    }
    expect((await request(app).get("/me/registrations").expect(503)).body.error.code).toBe("DEMO_USER_NOT_CONFIGURED");
  });

  it("seeds the demo identity idempotently without removing registrations", async () => {
    await request(app).post(endpoint).expect(200);
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], { env: process.env, encoding: "utf8" });
      expect(result.status, result.stderr).toBe(0);
    }
    expect(await prisma.user.count({ where: { id: DEMO_USER.id } })).toBe(1);
    expect(await prisma.event.count({ where: { id: { startsWith: "event-" } } })).toBe(3);
    expect(await prisma.registration.count()).toBe(1);
  });
});
