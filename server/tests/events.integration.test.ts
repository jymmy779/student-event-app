import { PrismaClient } from "@prisma/client";
import request, { type Test } from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { DEMO_USER } from "../src/demo-user.js";
import { createSession } from "../src/auth.js";

const prisma = new PrismaClient();
let demoToken = "";
function asDemo(testRequest: Test) {
  return testRequest.set("Authorization", `Bearer ${demoToken}`);
}

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.note.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.create({ data: DEMO_USER });
  demoToken = (await createSession(DEMO_USER.id)).token;
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
    // Since both events are ended, they are sorted descending by startsAt (event-2 then event-1)
    expect(response.body.data[0]).toMatchObject({ id: "event-2", title: "Ngày hội việc làm", startsAt: "2026-10-02T01:00:00.000Z" });
    expect(response.body.data[1]).toMatchObject({ id: "event-1", title: "Workshop thuyết trình", startsAt: "2026-10-01T01:00:00.000Z" });
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

  it("does not expose QR tokens in the event list", async () => {
    await prisma.event.createMany({ data: events });
    const response = await request(app).get("/events").expect(200);

    expect(response.body.data[0]).not.toHaveProperty("qrToken");
  });
});

describe("GET /events/:id", () => {
  it("returns a public event detail", async () => {
    await prisma.event.create({ data: events[0]! });

    const response = await asDemo(request(app).get("/events/event-2")).expect(200);

    expect(response.body).toMatchObject({
      data: {
        id: "event-2",
        title: "Ngày hội việc làm",
        description: "Mô tả 2",
        location: "Phòng 2",
      },
      error: null,
    });
    expect(response.body.data).not.toHaveProperty("qrToken");
  });

  it("returns a stable error when the event does not exist", async () => {
    const response = await asDemo(request(app)
      .get("/events/missing-event"))
      .expect(404);

    expect(response.body).toEqual({
      data: null,
      error: {
        code: "EVENT_NOT_FOUND",
        message: "Không tìm thấy sự kiện.",
      },
    });
  });
});

describe("Filter endpoints", () => {
  // Reference "now" for the test suite – fixed at the top of this block.
  // All test events are created relative to this timestamp.
  const NOW = new Date();
  const past = (offsetMs: number) => new Date(NOW.getTime() - offsetMs);
  const future = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);
  const H = 60 * 60 * 1000; // 1 hour in ms

  // 1. format=IN_PERSON only returns IN_PERSON events
  it("format=IN_PERSON only returns IN_PERSON events", async () => {
    await prisma.event.createMany({
      data: [
        { id: "f-inperson", title: "In Person Event", description: "d", location: "l", format: "IN_PERSON", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-ip", remainingSlots: 10 },
        { id: "f-online", title: "Online Event", description: "d", location: "l", format: "ONLINE", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-on", remainingSlots: 10 },
        { id: "f-hybrid", title: "Hybrid Event", description: "d", location: "l", format: "HYBRID", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-hy", remainingSlots: 10 },
      ],
    });

    const response = await request(app).get("/events?format=IN_PERSON").expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe("f-inperson");
    expect(response.body.data[0].format).toBe("IN_PERSON");
  });

  // 2. format=INVALID returns 400
  it("format=INVALID returns 400 with INVALID_FILTER", async () => {
    const response = await request(app).get("/events?format=INVALID").expect(400);
    expect(response.body).toEqual({
      data: null,
      error: { code: "INVALID_FILTER", message: "Giá trị bộ lọc không hợp lệ." },
    });
  });

  // 3. from=<iso> only returns events with startsAt >= from
  it("from=<iso> only returns events with startsAt >= from", async () => {
    const cutoff = future(5 * H);
    await prisma.event.createMany({
      data: [
        { id: "from-before", title: "Before cutoff", description: "d", location: "l", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-fb" },
        { id: "from-after", title: "After cutoff", description: "d", location: "l", startsAt: future(6 * H), endsAt: future(7 * H), qrToken: "tok-fa" },
      ],
    });

    const response = await request(app).get(`/events?from=${cutoff.toISOString()}`).expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe("from-after");
  });

  // 4. to=<iso> only returns events with endsAt <= to
  it("to=<iso> only returns events with endsAt <= to", async () => {
    const cutoff = future(4 * H);
    await prisma.event.createMany({
      data: [
        { id: "to-before", title: "Ends before cutoff", description: "d", location: "l", startsAt: future(1 * H), endsAt: future(3 * H), qrToken: "tok-tb" },
        { id: "to-after", title: "Ends after cutoff", description: "d", location: "l", startsAt: future(1 * H), endsAt: future(5 * H), qrToken: "tok-ta" },
      ],
    });

    const response = await request(app).get(`/events?to=${cutoff.toISOString()}`).expect(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe("to-before");
  });

  // 5. from with invalid date returns 400
  it("from with an invalid date returns 400", async () => {
    const response = await request(app).get("/events?from=not-a-date").expect(400);
    expect(response.body).toEqual({
      data: null,
      error: { code: "INVALID_FILTER", message: "Giá trị bộ lọc không hợp lệ." },
    });
  });

  // 6. status=UPCOMING only returns events with startsAt > now
  it("status=UPCOMING only returns events with startsAt > now", async () => {
    await prisma.event.createMany({
      data: [
        { id: "s-upcoming", title: "Upcoming", description: "d", location: "l", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-su" },
        { id: "s-ongoing", title: "Ongoing", description: "d", location: "l", startsAt: past(1 * H), endsAt: future(1 * H), qrToken: "tok-so" },
        { id: "s-ended", title: "Ended", description: "d", location: "l", startsAt: past(3 * H), endsAt: past(2 * H), qrToken: "tok-se" },
      ],
    });

    const response = await request(app).get("/events?status=UPCOMING").expect(200);
    expect(response.body.error).toBeNull();
    const ids = response.body.data.map((e: { id: string }) => e.id);
    expect(ids).toContain("s-upcoming");
    expect(ids).not.toContain("s-ongoing");
    expect(ids).not.toContain("s-ended");
  });

  // 7. status=ENDED only returns events with endsAt <= now
  it("status=ENDED only returns events with endsAt <= now", async () => {
    await prisma.event.createMany({
      data: [
        { id: "e-upcoming", title: "Upcoming", description: "d", location: "l", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-eu" },
        { id: "e-ongoing", title: "Ongoing", description: "d", location: "l", startsAt: past(1 * H), endsAt: future(1 * H), qrToken: "tok-eo" },
        { id: "e-ended", title: "Ended", description: "d", location: "l", startsAt: past(3 * H), endsAt: past(2 * H), qrToken: "tok-ee" },
      ],
    });

    const response = await request(app).get("/events?status=ENDED").expect(200);
    expect(response.body.error).toBeNull();
    const ids = response.body.data.map((e: { id: string }) => e.id);
    expect(ids).toContain("e-ended");
    expect(ids).not.toContain("e-upcoming");
    expect(ids).not.toContain("e-ongoing");
  });

  // 8. registration=OPEN only returns events with available slots
  it("registration=OPEN only returns events with available slots and open registration", async () => {
    await prisma.event.createMany({
      data: [
        { id: "reg-open", title: "Open reg", description: "d", location: "l", startsAt: future(1 * H), endsAt: future(2 * H), qrToken: "tok-ro", remainingSlots: 10, registrationDeadline: null },
        { id: "reg-full", title: "Full reg", description: "d", location: "l", startsAt: future(1 * H), endsAt: future(2 * H), qrToken: "tok-rf", remainingSlots: 0, registrationDeadline: null },
        { id: "reg-ended", title: "Ended event reg", description: "d", location: "l", startsAt: past(3 * H), endsAt: past(2 * H), qrToken: "tok-re", remainingSlots: 10 },
      ],
    });

    const response = await request(app).get("/events?registration=OPEN").expect(200);
    expect(response.body.error).toBeNull();
    const ids = response.body.data.map((e: { id: string }) => e.id);
    expect(ids).toContain("reg-open");
    expect(ids).not.toContain("reg-full");
    expect(ids).not.toContain("reg-ended");
  });

  // 9. registration=FULL only returns events with remainingSlots=0
  it("registration=FULL only returns events with remainingSlots <= 0", async () => {
    await prisma.event.createMany({
      data: [
        { id: "full-open", title: "Has slots", description: "d", location: "l", startsAt: future(1 * H), endsAt: future(2 * H), qrToken: "tok-fo", remainingSlots: 5 },
        { id: "full-zero", title: "No slots", description: "d", location: "l", startsAt: future(1 * H), endsAt: future(2 * H), qrToken: "tok-fz", remainingSlots: 0 },
      ],
    });

    const response = await request(app).get("/events?registration=FULL").expect(200);
    expect(response.body.error).toBeNull();
    const ids = response.body.data.map((e: { id: string }) => e.id);
    expect(ids).toContain("full-zero");
    expect(ids).not.toContain("full-open");
  });

  // 10. Combined format=IN_PERSON&status=UPCOMING only returns events matching both
  it("combined format=IN_PERSON&status=UPCOMING only returns matching events", async () => {
    await prisma.event.createMany({
      data: [
        { id: "combo-match", title: "In Person Upcoming", description: "d", location: "l", format: "IN_PERSON", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-cm" },
        { id: "combo-online-upcoming", title: "Online Upcoming", description: "d", location: "l", format: "ONLINE", startsAt: future(2 * H), endsAt: future(3 * H), qrToken: "tok-ou" },
        { id: "combo-inperson-ended", title: "In Person Ended", description: "d", location: "l", format: "IN_PERSON", startsAt: past(3 * H), endsAt: past(2 * H), qrToken: "tok-ie" },
      ],
    });

    const response = await request(app).get("/events?format=IN_PERSON&status=UPCOMING").expect(200);
    expect(response.body.error).toBeNull();
    const ids = response.body.data.map((e: { id: string }) => e.id);
    expect(ids).toContain("combo-match");
    expect(ids).not.toContain("combo-online-upcoming");
    expect(ids).not.toContain("combo-inperson-ended");
  });
});
