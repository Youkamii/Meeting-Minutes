import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const types = searchParams.get("types")?.split(",");

  // Strip HTML tags from query to prevent matching against markup
  const cleaned = q?.replace(/<[^>]*>?/g, "").trim();

  if (!cleaned) {
    return NextResponse.json({
      data: { companies: [], businesses: [], progressItems: [], weeklyActions: [], notes: [] },
      total: 0,
    });
  }

  const search = { contains: cleaned, mode: "insensitive" as const };
  const shouldSearch = (type: string) => !types || types.includes(type);

  const [companies, businesses, progressItems, weeklyActions, notes] =
    await Promise.all([
      shouldSearch("company")
        ? prisma.company.findMany({
            where: {
              isArchived: false,
              OR: [
                { canonicalName: search },
                { aliases: { some: { alias: search } } },
              ],
            },
            include: { aliases: true },
            take: 10,
          })
        : [],
      shouldSearch("business")
        ? prisma.business.findMany({
            where: { isArchived: false, name: search },
            include: { company: true },
            take: 10,
          })
        : [],
      shouldSearch("progress_item")
        ? prisma.progressItem.findMany({
            where: { content: search },
            include: { business: { include: { company: true } } },
            take: 10,
          })
        : [],
      shouldSearch("weekly_action")
        ? prisma.weeklyAction.findMany({
            where: { isArchived: false, content: search },
            include: { company: true, business: true, cycle: true },
            take: 10,
          })
        : [],
      shouldSearch("note")
        ? prisma.internalNote.findMany({
            where: { OR: [{ title: search }, { body: search }] },
            take: 10,
          })
        : [],
    ]);

  const total =
    companies.length +
    businesses.length +
    progressItems.length +
    weeklyActions.length +
    notes.length;

  return NextResponse.json({
    data: { companies, businesses, progressItems, weeklyActions, notes },
    total,
  });
}
