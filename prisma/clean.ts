import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Safety check: require --force flag
if (!process.argv.includes("--force")) {
  console.error("⚠ This script deletes ALL data. Run with --force to confirm.");
  process.exit(1);
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required");
}
const pool = new pg.Pool({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete in order (respect foreign keys)
  await prisma.recentView.deleteMany({});
  await prisma.internalNoteVersion.deleteMany({});
  await prisma.weeklyActionVersion.deleteMany({});
  await prisma.progressItemVersion.deleteMany({});
  await prisma.businessVersion.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.internalNote.deleteMany({});
  await prisma.weeklyAction.deleteMany({});
  await prisma.progressItem.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.companyAlias.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.weeklyCycle.deleteMany({});
  console.log("All data cleaned.");
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
