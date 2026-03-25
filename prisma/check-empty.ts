import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DB URL");
const pool = new pg.Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool as any) });

async function main() {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { businesses: true, actions: true } } },
    where: { isArchived: false },
    orderBy: { canonicalName: "asc" },
  });

  console.log("=== All companies ===");
  for (const c of companies) {
    console.log(`${c.canonicalName} | biz:${c._count.businesses} | actions:${c._count.actions}`);
  }

  // Companies created by import that have no businesses
  const noBusinesses = companies.filter((c) => c._count.businesses === 0);
  console.log(`\n=== No businesses (${noBusinesses.length}) ===`);
  for (const c of noBusinesses) {
    console.log(`${c.canonicalName} (actions: ${c._count.actions})`);
  }

  // Completely empty (no biz, no actions)
  const empty = companies.filter((c) => c._count.businesses === 0 && c._count.actions === 0);
  if (empty.length > 0) {
    console.log(`\nDeleting ${empty.length} empty companies...`);
    for (const c of empty) {
      await prisma.companyAlias.deleteMany({ where: { companyId: c.id } });
      await prisma.company.delete({ where: { id: c.id } });
      console.log(`  Deleted: ${c.canonicalName}`);
    }
  } else {
    console.log("\nNo completely empty companies found.");
  }
}

main()
  .then(() => { prisma.$disconnect(); pool.end(); })
  .catch((e) => { console.error(e); prisma.$disconnect(); pool.end(); });
