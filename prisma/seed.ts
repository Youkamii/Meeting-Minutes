import { PrismaClient } from "@prisma/client";
import {
  getISOWeekNumber,
  getISOWeekYear,
  getWeekDateRange,
} from "../src/lib/weekly-cycle";

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
  const year = getISOWeekYear(now);
  const weekNumber = getISOWeekNumber(now);
  const { startDate: monday, endDate: sunday } = getWeekDateRange(
    year,
    weekNumber,
  );

  const currentCycle = await prisma.weeklyCycle.upsert({
    where: {
      year_weekNumber: {
        year,
        weekNumber,
      },
    },
    update: {},
    create: {
      year,
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
