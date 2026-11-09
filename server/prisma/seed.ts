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
  for (const account of [
    { name: "Demo student", email: "demostudent@gmail.com", role: "STUDENT" },
    { name: "Demo organizer", email: "demoorganizer@gmail.com", role: "ORGANIZER" },
  ]) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, passwordHash: demoPasswordHash },
      create: { ...account, passwordHash: demoPasswordHash },
    });
  }

  for (const event of events) {
    await prisma.event.upsert({ where: { qrToken: event.qrToken }, update: event, create: event });
  }
  console.log(`Seeded demo accounts and ${events.length} events (idempotent upsert).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
