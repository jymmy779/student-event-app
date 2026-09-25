import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const [eventCount, demoUserCount] = await Promise.all([
    prisma.event.count(),
    prisma.user.count({ where: { id: "demo-user" } }),
  ]);
  console.log(`DEMO_EVENT_COUNT=${eventCount}`);
  console.log(`DEMO_USER_COUNT=${demoUserCount}`);
  if (eventCount !== 3 || demoUserCount !== 1) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
