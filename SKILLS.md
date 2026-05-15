# Skills & Technical Reference

This document captures all the technical patterns, decisions, and skills used in this project so future sessions don't need to re-derive them.

---

## Agent Rules

### Before Writing Any Code
1. Read `CLAUDE.md` — it has the full project context, tech stack warnings, file structure, and build status.
2. Read `node_modules/next/dist/docs/01-app/` for Next.js 16 API if unfamiliar.
3. Check the **Build Status** section in CLAUDE.md to understand what is done and what is blocked.

### Critical Gotchas
- **Prisma 7**: Requires a Driver Adapter. Do NOT write `new PrismaClient()` without an adapter. Check `lib/prisma.ts` for the current pattern.
- **params/searchParams**: These are Promises in Next.js 16. Always `await` them in server components.
- **Recharts**: Always `"use client"` in any file that imports from recharts.
- **Tailwind v4**: No config file. Use standard utility classes only.
- **Generated Prisma**: Lives in `app/generated/prisma/`. Never edit it. Regenerate with `npx prisma generate` after schema changes.
- **Next.js 16**: Breaking changes from prior versions — APIs, conventions, and file structure may differ from training data. Read `node_modules/next/dist/docs/` before writing any code.

### Workflow
- After any schema change: `npx prisma migrate dev --name <description>` then `npx prisma generate`
- Type check before reporting done: `npx tsc --noEmit`
- Admin passphrase is in `.env.local` — never commit this file

---

## Next.js 16 (App Router)

### Route Handlers
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ ok: true });
}
```

### Server Component with Params (params is a Promise in Next.js 16)
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Client Component with useSearchParams (must wrap in Suspense)
```typescript
"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Inner() {
  const searchParams = useSearchParams();
  const value = searchParams.get("key");
}

export default function Page() {
  return <Suspense fallback="Loading..."><Inner /></Suspense>;
}
```

### Setting Cookies in Route Handler
```typescript
const res = NextResponse.json({ ok: true });
res.cookies.set("session", value, { httpOnly: true, sameSite: "lax", maxAge: 3600, path: "/" });
return res;
```

### Reading Cookies in Route Handler
```typescript
import { cookies } from "next/headers";
const cookieStore = await cookies(); // Note: cookies() returns a Promise in Next.js 16
const val = cookieStore.get("session")?.value;
```

---

## Prisma 7 (SQLite with Driver Adapter)

### Schema Pattern
```prisma
generator client {
  provider        = "prisma-client"
  output          = "../app/generated/prisma"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
}
```

### Client Singleton (lib/prisma.ts)
```typescript
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";  // or better-sqlite3 adapter
// ... adapter instantiation
```

### Commands
```bash
npx prisma migrate dev --name <description>   # create + apply migration
npx prisma generate                            # regenerate client after schema change
npx prisma studio                              # GUI to inspect DB
```

### Import Path
Always import from `@/app/generated/prisma/client` (not `@prisma/client` or `@/app/generated/prisma`).

---

## Tailwind v4

- No `tailwind.config.js` needed for standard usage
- CSS entry: `@import "tailwindcss"` in `globals.css`
- PostCSS plugin: `@tailwindcss/postcss`
- All standard utility classes work identically to v3
- Custom theme extensions go in CSS using `@theme` block

---

## Recharts

All chart components must be in `"use client"` files.

### Responsive Bar Chart Pattern
```typescript
"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={280}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="label" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

### Pie Chart Label Typing
```typescript
import { type PieLabelRenderProps } from "recharts";

label={({ name, percent }: PieLabelRenderProps) =>
  `${name ?? ""} ${Math.round(((percent as number) ?? 0) * 100)}%`
}
```

### Stacked Bar (first-timers vs returning)
```typescript
<Bar dataKey="returning" stackId="a" fill="#3b82f6" />
<Bar dataKey="firstTimers" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
```

---

## Authentication Pattern (Simple Passphrase)

- Passphrase stored in `ADMIN_PASSPHRASE` env var (`.env.local`)
- Login: `POST /api/admin/auth` compares passphrase, sets HttpOnly cookie
- Protected pages: fetch protected API → if 401, `router.replace("/admin")`
- Protected APIs: read cookie, compare to `process.env.ADMIN_PASSPHRASE`
- Cookie name: `admin_session`, maxAge: 8 hours

---

## Phone Number Handling

- Strip all non-digits: `(phone ?? "").replace(/\D/g, "")`
- Store as digit-only string
- Display formatting is handled on the client
- Use `inputMode="numeric"` and `type="tel"` for mobile keyboard

---

## Date Utilities

```typescript
// Today's service date (YYYY-MM-DD)
function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

// Generate last N Sundays
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
```

---

## Project-Specific API Contracts

### POST /api/checkin
- Input: `{ phone: string }`
- Returns: `{ status: "new" | "checkedIn" | "duplicate", phone?: string, name?: string }`

### POST /api/checkin/register
- Input: `{ phone, name, ageGroup, gender }`
- Returns: `{ status: "checkedIn" | "duplicate", name: string }`

### POST /api/admin/auth
- Input: `{ passphrase: string }`
- Returns: 200 `{ ok: true }` + sets cookie, or 401

### GET /api/admin/stats?weeks=N
- Auth: reads `admin_session` cookie
- Returns: `{ weeklyData, arrivalData, ageGroups, genders, summary }`

---

## Deployment Checklist
- [ ] Change `ADMIN_PASSPHRASE` in `.env.local` to something secure
- [ ] Add `prisma/dev.db` to `.gitignore` (or use production DB)
- [ ] On Vercel: set `DATABASE_URL` and `ADMIN_PASSPHRASE` as environment variables
- [ ] For production SQLite on Vercel: use Turso (libSQL) — not a plain file (file system is ephemeral on serverless)
- [ ] Consider migrating to PostgreSQL (Supabase/Neon free tier) for production
