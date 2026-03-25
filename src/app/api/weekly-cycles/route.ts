import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentWeek,
  getWeekDateRange,
} from "@/lib/weekly-cycle";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = searchParams.get("year");
  const weekNumber = searchParams.get("week_number");
  const current = searchParams.get("current") === "true";

  if (current) {
    const { year: y, weekNumber: w } = getCurrentWeek();
    const { startDate, endDate } = getWeekDateRange(y, w);

    const cycle = await prisma.weeklyCycle.upsert({
      where: { year_weekNumber: { year: y, weekNumber: w } },
      update: {},
      create: { year: y, weekNumber: w, startDate, endDate },
    });

    return NextResponse.json({ data: cycle });
  }

  const where = {
    ...(year ? { year: parseInt(year) } : {}),
    ...(weekNumber ? { weekNumber: parseInt(weekNumber) } : {}),
  };

  const cycles = await prisma.weeklyCycle.findMany({
    where,
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
    take: 52,
  });

  return NextResponse.json({ data: cycles });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, weekNumber } = body;

    if (!year || !weekNumber) {
      return NextResponse.json(
        { error: "VALIDATION", message: "year and weekNumber are required" },
        { status: 400 },
      );
    }

    const { startDate, endDate } = getWeekDateRange(year, weekNumber);

    const cycle = await prisma.weeklyCycle.upsert({
      where: { year_weekNumber: { year, weekNumber } },
      update: {},
      create: { year, weekNumber, startDate, endDate },
    });

    return NextResponse.json({ data: cycle });
  } catch (error) {
    console.error("POST /api/weekly-cycles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
