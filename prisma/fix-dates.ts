import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is required");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
const prisma = new PrismaClient({ adapter });

// (MM/DD) or (M/DD) or (MM/D) or (M/D) pattern
const DATE_PATTERN = /\((\d{1,2})\/(\d{1,2})\)\s*/;

// Base year: months >= cutoffMonth are baseYear, otherwise baseYear+1
const BASE_YEAR = parseInt(process.argv[2] || "2025", 10);
const CUTOFF_MONTH = parseInt(process.argv[3] || "4", 10);

function parseDate(month: number, day: number): Date {
  const year = month >= CUTOFF_MONTH ? BASE_YEAR : BASE_YEAR + 1;
  return new Date(year, month - 1, day);
}

function stripDatePrefixes(content: string): string {
  return content
    .split("\n")
    .map((line) => line.replace(DATE_PATTERN, "").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

async function main() {
  const items = await prisma.progressItem.findMany();
  console.log(`Found ${items.length} progress items`);
  console.log(`Date logic: month >= ${CUTOFF_MONTH} → ${BASE_YEAR}, else → ${BASE_YEAR + 1}`);

  let updated = 0;
  for (const item of items) {
    if (!item.content) continue;

    const match = item.content.match(DATE_PATTERN);
    if (!match) continue;

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const date = parseDate(month, day);
    const cleanContent = stripDatePrefixes(item.content);

    await prisma.progressItem.update({
      where: { id: item.id },
      data: {
        date,
        content: cleanContent,
      },
    });

    updated++;
    console.log(
      `  [${item.stage}] ${date.toISOString().slice(0, 10)} | ${cleanContent.substring(0, 60)}...`,
    );
  }

  console.log(`\nUpdated ${updated}/${items.length} items`);
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
