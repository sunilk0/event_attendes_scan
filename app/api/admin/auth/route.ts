import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json();

  if (!passphrase || passphrase !== process.env.ADMIN_PASSPHRASE) {
    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
