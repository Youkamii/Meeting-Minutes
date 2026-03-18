import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const isKey = searchParams.get("is_key");
  const includeArchived = searchParams.get("include_archived") === "true";
  const sort = searchParams.get("sort") ?? "sortOrder";
  const order = searchParams.get("order") ?? "asc";

  const where = {
    ...(includeArchived ? {} : { isArchived: false }),
    ...(isKey !== null ? { isKey: isKey === "true" } : {}),
    ...(search
      ? {
          OR: [
            { canonicalName: { contains: search, mode: "insensitive" as const } },
            { aliases: { some: { alias: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: { aliases: true },
      orderBy: { [sort]: order },
    }),
    prisma.company.count({ where }),
  ]);

  const companies = data.map((c) => ({
    ...c,
    aliases: c.aliases.map((a) => a.alias),
  }));

  return NextResponse.json({ data: companies, total });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { canonicalName, aliases = [], isKey = false } = body;

  if (!canonicalName?.trim()) {
    return NextResponse.json(
      { error: "VALIDATION", message: "canonicalName is required" },
      { status: 400 },
    );
  }

  const company = await prisma.company.create({
    data: {
      canonicalName: canonicalName.trim(),
      isKey,
      aliases: {
        create: aliases
          .filter((a: string) => a.trim())
          .map((alias: string) => ({ alias: alias.trim() })),
      },
    },
    include: { aliases: true },
  });

  await createAuditLog({
    entityType: "company",
    entityId: company.id,
    action: "create",
    changes: { canonicalName, aliases, isKey },
  });

  return NextResponse.json(
    {
      data: {
        ...company,
        aliases: company.aliases.map((a) => a.alias),
      },
    },
    { status: 201 },
  );
}
