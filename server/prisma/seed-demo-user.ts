import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const demoUser = {
  id: "user-demo-student",
  name: "Sinh viên Demo",
  email: "demo@student.university.edu.vn",
};

async function main() {
  await prisma.user.upsert({
    where: { id: demoUser.id },
    update: demoUser,
    create: demoUser,
  });
  console.log(`Seeded demo user: ${demoUser.name} (${demoUser.email})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
