import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_AGE_GROUPS = ["CHILD", "YOUTH", "ADULT", "SENIOR"];
const VALID_GENDERS = ["MALE", "FEMALE", "OTHER"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const { phone, name, ageGroup, gender } = await req.json();

  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits || !name?.trim() || !VALID_AGE_GROUPS.includes(ageGroup) || !VALID_GENDERS.includes(gender)) {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  }

  const today = todayDate();

  const existing = await prisma.member.findUnique({ where: { phone: digits } });
  if (existing) {
    const dupe = await prisma.checkIn.findFirst({
      where: { memberId: existing.id, serviceDate: today },
    });
    if (dupe) {
      return NextResponse.json({ status: "duplicate", name: existing.name });
    }
    await prisma.checkIn.create({ data: { memberId: existing.id, serviceDate: today } });
    return NextResponse.json({ status: "checkedIn", name: existing.name });
  }

  const member = await prisma.member.create({
    data: { phone: digits, name: name.trim(), ageGroup, gender },
  });

  await prisma.checkIn.create({
    data: { memberId: member.id, serviceDate: today },
  });

  return NextResponse.json({ status: "checkedIn", name: member.name });
}
