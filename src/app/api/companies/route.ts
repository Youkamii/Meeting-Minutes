import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp } from "@/lib/audit";

const ALLOWED_SORT_FIELDS = ["canonicalName", "sortOrder", "createdAt"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const isKey = searchParams.get("is_key");
    const includeArchived = searchParams.get("include_archived") === "true";
    const sortParam = searchParams.get("sort") ?? "sortOrder";
    const order = searchParams.get("order") ?? "asc";

    const sort = ALLOWED_SORT_FIELDS.includes(sortParam) ? sortParam : "sortOrder";

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
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canonicalName, aliases = [], isKey = false } = body;

    if (!canonicalName?.trim()) {
      return NextResponse.json(
        { error: "VALIDATION", message: "canonicalName is required" },
        { status: 400 },
      );
    }

    // New companies go to the end of the list
    const maxSort = await prisma.company.aggregate({ _max: { sortOrder: true } });
    const nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1;

    const company = await prisma.company.create({
      data: {
        canonicalName: canonicalName.trim(),
        isKey,
        sortOrder: nextSortOrder,
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
      ip: getClientIp(request),
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
  } catch (error) {
    console.error("POST /api/companies error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
