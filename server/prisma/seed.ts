import { PrismaClient } from "@prisma/client";
import { DEMO_USER } from "../src/demo-user.js";
import { hashPassword } from "../src/auth.js";

const prisma = new PrismaClient();
const events = [
  { title: "Workshop Kỹ năng thuyết trình", description: "Thực hành xây dựng nội dung và trình bày tự tin trước đám đông.", location: "Phòng A1.01", startsAt: new Date("2026-09-15T01:00:00.000Z"), endsAt: new Date("2026-09-15T04:00:00.000Z"), qrToken: "mvp-past-workshop-token" },
  { title: "Ngày hội việc làm sinh viên", description: "Gặp gỡ doanh nghiệp, tìm hiểu vị trí thực tập và cơ hội nghề nghiệp.", location: "Hội trường A", startsAt: new Date("2026-09-25T00:00:00.000Z"), endsAt: new Date("2026-09-25T10:00:00.000Z"), qrToken: "mvp-current-career-token" },
  { title: "Seminar Công nghệ và AI", description: "Chia sẻ xu hướng ứng dụng AI và kinh nghiệm học tập cho sinh viên.", location: "Phòng B2.02", startsAt: new Date("2026-10-10T06:30:00.000Z"), endsAt: new Date("2026-10-10T09:30:00.000Z"), qrToken: "mvp-future-tech-token" },
] as const;

async function main() {
  const demoUser = { name: DEMO_USER.name, email: DEMO_USER.email };
  await prisma.user.upsert({ where: { email: demoUser.email }, update: {}, create: demoUser });

  // Shared local demo accounts for manual QA. Both use password 12345678.
  const demoPasswordHash = await hashPassword("12345678");
  const demoAccounts = [
    { name: "Demo student", email: "demostudent@gmail.com", role: "STUDENT" },
    { name: "Demo organizer", email: "demoorganizer@gmail.com", role: "ORGANIZER" },
  ] as const;
  const seededUsers = new Map<string, { id: string }>();
  for (const account of demoAccounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, passwordHash: demoPasswordHash },
      create: { ...account, passwordHash: demoPasswordHash },
    });
    seededUsers.set(account.email, user);
  }

  for (const event of events) {
    await prisma.event.upsert({ where: { qrToken: event.qrToken }, update: event, create: event });
  }

  // Always-available manual QA event. Its window is rebuilt on every seed run,
  // and the demo student is registered with checkedInAt cleared for repeatable testing.
  const now = Date.now();
  const checkInEvent = await prisma.event.upsert({
    where: { qrToken: "mvp-always-check-in-token" },
    update: {
      title: "TEST — Quét QR check-in thành công",
      description: "Sự kiện test giao diện check-in. Dùng tài khoản demo student để quét QR.",
      location: "Phòng test QR",
      format: "IN_PERSON",
      startsAt: new Date(now - 10 * 60 * 1000),
      endsAt: new Date(now + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now - 20 * 60 * 1000),
      capacity: 100,
      remainingSlots: 99,
      isHidden: false,
      createdById: seededUsers.get("demoorganizer@gmail.com")!.id,
    },
    create: {
      title: "TEST — Quét QR check-in thành công",
      description: "Sự kiện test giao diện check-in. Dùng tài khoản demo student để quét QR.",
      location: "Phòng test QR",
      format: "IN_PERSON",
      startsAt: new Date(now - 10 * 60 * 1000),
      endsAt: new Date(now + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now - 20 * 60 * 1000),
      capacity: 100,
      remainingSlots: 99,
      qrToken: "mvp-always-check-in-token",
      createdById: seededUsers.get("demoorganizer@gmail.com")!.id,
    },
  });
  await prisma.registration.upsert({
    where: { userId_eventId: { userId: seededUsers.get("demostudent@gmail.com")!.id, eventId: checkInEvent.id } },
    update: { checkedInAt: null },
    create: { userId: seededUsers.get("demostudent@gmail.com")!.id, eventId: checkInEvent.id },
  });

  const newCheckInEvent = await prisma.event.upsert({
    where: { qrToken: "mvp-new-check-in-token" },
    update: {
      title: "TEST — Sự kiện check-in mới",
      description: "Event mới để kiểm tra giao diện quét QR và màn hình check-in thành công.",
      location: "Phòng demo QR mới",
      format: "IN_PERSON",
      startsAt: new Date(now - 10 * 60 * 1000),
      endsAt: new Date(now + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now - 20 * 60 * 1000),
      capacity: 100,
      remainingSlots: 99,
      isHidden: false,
      createdById: seededUsers.get("demoorganizer@gmail.com")!.id,
    },
    create: {
      title: "TEST — Sự kiện check-in mới",
      description: "Event mới để kiểm tra giao diện quét QR và màn hình check-in thành công.",
      location: "Phòng demo QR mới",
      format: "IN_PERSON",
      startsAt: new Date(now - 10 * 60 * 1000),
      endsAt: new Date(now + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now - 20 * 60 * 1000),
      capacity: 100,
      remainingSlots: 99,
      qrToken: "mvp-new-check-in-token",
      createdById: seededUsers.get("demoorganizer@gmail.com")!.id,
    },
  });
  await prisma.registration.upsert({
    where: { userId_eventId: { userId: seededUsers.get("demostudent@gmail.com")!.id, eventId: newCheckInEvent.id } },
    update: { checkedInAt: null },
    create: { userId: seededUsers.get("demostudent@gmail.com")!.id, eventId: newCheckInEvent.id },
  });

  const thirdCheckInEvent = await prisma.event.upsert({
    where: { qrToken: "mvp-new-check-in-token-2" },
    update: {
      title: "TEST — Sự kiện check-in số 3",
      description: "Sự kiện test thứ ba để kiểm tra nhận diện đúng sự kiện khi quét QR.",
      location: "Phòng demo QR số 3",
      format: "IN_PERSON",
      startsAt: new Date(now - 10 * 60 * 1000),
      endsAt: new Date(now + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now - 20 * 60 * 1000),
      capacity: 100,
      remainingSlots: 99,
      isHidden: false,
      createdById: seededUsers.get("demoorganizer@gmail.com")!.id,
    },
    create: {
      title: "TEST — Sự kiện check-in số 3",
      description: "Sự kiện test thứ ba để kiểm tra nhận diện đúng sự kiện khi quét QR.",
      location: "Phòng demo QR số 3",
      format: "IN_PERSON",
      startsAt: new Date(now - 10 * 60 * 1000),
      endsAt: new Date(now + 2 * 60 * 60 * 1000),
      registrationDeadline: new Date(now - 20 * 60 * 1000),
      capacity: 100,
      remainingSlots: 99,
      qrToken: "mvp-new-check-in-token-2",
      createdById: seededUsers.get("demoorganizer@gmail.com")!.id,
    },
  });
  await prisma.registration.upsert({
    where: { userId_eventId: { userId: seededUsers.get("demostudent@gmail.com")!.id, eventId: thirdCheckInEvent.id } },
    update: { checkedInAt: null },
    create: { userId: seededUsers.get("demostudent@gmail.com")!.id, eventId: thirdCheckInEvent.id },
  });
  console.log(`Seeded demo accounts and ${events.length + 3} events (idempotent upsert).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
