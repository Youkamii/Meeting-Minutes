import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create system user
  const systemUser = await prisma.user.upsert({
    where: { email: "system@meeting-minutes.local" },
    update: {},
    create: {
      email: "system@meeting-minutes.local",
      name: "System",
      role: "admin",
      status: "approved",
    },
  });

  console.log(`System user created: ${systemUser.id}`);

  // Create current week cycle
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Calculate ISO week number
  const janFirst = new Date(now.getFullYear(), 0, 1);
  const daysSinceJan1 =
    Math.floor(
      (now.getTime() - janFirst.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  const weekNumber = Math.ceil(
    (daysSinceJan1 + janFirst.getDay()) / 7,
  );

  const currentCycle = await prisma.weeklyCycle.upsert({
    where: {
      year_weekNumber: {
        year: now.getFullYear(),
        weekNumber,
      },
    },
    update: {},
    create: {
      year: now.getFullYear(),
      weekNumber,
      startDate: monday,
      endDate: sunday,
    },
  });

  console.log(
    `Current weekly cycle: ${currentCycle.year}-W${currentCycle.weekNumber}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
