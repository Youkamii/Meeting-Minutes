import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required");
}

const pool = new pg.Pool({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

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
  const d = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
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
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
