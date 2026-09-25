import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const events = [
  { id: "event-past-workshop", title: "Workshop Kỹ năng thuyết trình", description: "Thực hành xây dựng nội dung và trình bày tự tin trước đám đông.", location: "Phòng A1.01", startsAt: new Date("2026-09-15T01:00:00.000Z"), endsAt: new Date("2026-09-15T04:00:00.000Z"), qrToken: "mvp-past-workshop-token" },
  { id: "event-current-career", title: "Ngày hội việc làm sinh viên", description: "Gặp gỡ doanh nghiệp, tìm hiểu vị trí thực tập và cơ hội nghề nghiệp.", location: "Hội trường A", startsAt: new Date("2026-09-25T00:00:00.000Z"), endsAt: new Date("2026-09-25T10:00:00.000Z"), qrToken: "mvp-current-career-token" },
  { id: "event-future-tech", title: "Seminar Công nghệ và AI", description: "Chia sẻ xu hướng ứng dụng AI và kinh nghiệm học tập cho sinh viên.", location: "Phòng B2.02", startsAt: new Date("2026-10-10T06:30:00.000Z"), endsAt: new Date("2026-10-10T09:30:00.000Z"), qrToken: "mvp-future-tech-token" },
] as const;

async function main() {
  for (const event of events) {
    await prisma.event.upsert({ where: { id: event.id }, update: event, create: event });
  }
  console.log(`Seeded ${events.length} events (idempotent upsert).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
