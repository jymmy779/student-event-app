import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const eventCount = await prisma.event.count();
  console.log(`DEMO_EVENT_COUNT=${eventCount}`);
  if (eventCount !== 3) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
