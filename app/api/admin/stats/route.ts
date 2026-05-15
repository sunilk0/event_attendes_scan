import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSundaysBefore(n: number): string[] {
  const sundays: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
  for (let i = 0; i < n; i++) {
    sundays.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 7);
  }
  return sundays.reverse();
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weeksParam = req.nextUrl.searchParams.get("weeks");
  const weeks = Math.min(Math.max(parseInt(weeksParam ?? "12", 10) || 12, 4), 52);

  const sundays = getSundaysBefore(weeks);
  const startDate = sundays[0];

  const allCheckIns = await prisma.checkIn.findMany({
    where: { serviceDate: { gte: startDate } },
    include: { member: true },
    orderBy: { checkedInAt: "asc" },
  });

  // Weekly headcount + first-timers
  const headcountMap: Record<string, { total: number; firstTimers: number; returning: number }> = {};
  for (const s of sundays) {
    headcountMap[s] = { total: 0, firstTimers: 0, returning: 0 };
  }
  for (const ci of allCheckIns) {
    if (!headcountMap[ci.serviceDate]) continue;
    headcountMap[ci.serviceDate].total++;
    const memberFirstDate = ci.member.createdAt.toISOString().slice(0, 10);
    if (memberFirstDate === ci.serviceDate) {
      headcountMap[ci.serviceDate].firstTimers++;
    } else {
      headcountMap[ci.serviceDate].returning++;
    }
  }

  const weeklyData = sundays.map((date) => ({
    date,
    label: new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...headcountMap[date],
  }));

  // Arrival time distribution (15-min buckets across all selected weeks)
  const arrivalBuckets: Record<string, number> = {};
  for (const ci of allCheckIns) {
    const t = new Date(ci.checkedInAt);
    const h = t.getHours();
    const m = Math.floor(t.getMinutes() / 15) * 15;
    const key = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    arrivalBuckets[key] = (arrivalBuckets[key] ?? 0) + 1;
  }
  const arrivalData = Object.entries(arrivalBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, count]) => ({ time, count }));

  // Demographics (aggregated totals)
  const demoCounts: Record<string, number> = {};
  for (const ci of allCheckIns) {
    const { ageGroup, gender } = ci.member;
    const ageKey = ageGroup;
    const genKey = gender;
    demoCounts[ageKey] = (demoCounts[ageKey] ?? 0) + 1;
    demoCounts[genKey] = (demoCounts[genKey] ?? 0) + 1;
  }

  const ageGroups = ["CHILD", "YOUTH", "ADULT", "SENIOR"].map((g) => ({
    name: g.charAt(0) + g.slice(1).toLowerCase(),
    value: demoCounts[g] ?? 0,
  }));

  const genders = ["MALE", "FEMALE", "OTHER"].map((g) => ({
    name: g.charAt(0) + g.slice(1).toLowerCase(),
    value: demoCounts[g] ?? 0,
  }));

  // Summary totals
  const totalAttendance = allCheckIns.length;
  const uniqueMembers = new Set(allCheckIns.map((ci) => ci.memberId)).size;
  const thisWeek = headcountMap[sundays[sundays.length - 1]]?.total ?? 0;
  const lastWeek = headcountMap[sundays[sundays.length - 2]]?.total ?? 0;

  return NextResponse.json({
    weeklyData,
    arrivalData,
    ageGroups,
    genders,
    summary: { totalAttendance, uniqueMembers, thisWeek, lastWeek },
  });
}
