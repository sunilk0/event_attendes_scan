import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { phone: digits } });

  if (!member) {
    return NextResponse.json({ status: "new", phone: digits });
  }

  const today = todayDate();
  const existing = await prisma.checkIn.findFirst({
    where: { memberId: member.id, serviceDate: today },
  });

  if (existing) {
    return NextResponse.json({ status: "duplicate", name: member.name });
  }

  await prisma.checkIn.create({
    data: { memberId: member.id, serviceDate: today },
  });

  return NextResponse.json({ status: "checkedIn", name: member.name });
}
