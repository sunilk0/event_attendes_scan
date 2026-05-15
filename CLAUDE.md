@AGENTS.md

# Church Attendance Tracker — Project Context

## What This Is
A mobile-friendly web app for a church fellowship to track Sunday service attendance. Members check in on their own phones by entering their phone number. First-time visitors get registered on the spot. Admins view a dashboard of attendance trends and demographics.

## Core Requirements
- No hardware needed — members use their own smartphones
- Phone number is the unique identifier
- First check-in creates the member profile (name, age group, gender)
- Check-in is always open — grouped by calendar date automatically
- One weekly Sunday service tracked
- Admin dashboard protected by a passphrase (env var `ADMIN_PASSPHRASE`)

## Tech Stack
| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | SQLite via Prisma 7 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Auth | HttpOnly cookie set by `/api/admin/auth`, passphrase compared against `ADMIN_PASSPHRASE` env var |

## Key Warnings
- **Prisma 7** is a breaking change from Prisma 5/6. It requires a Driver Adapter — SQLite needs `@prisma/adapter-better-sqlite3` or similar. The constructor `new PrismaClient({})` does NOT work without an adapter.
- **Next.js 16** params and searchParams are Promises — always `await params` in server components.
- **Tailwind v4** — uses `@import "tailwindcss"` in globals.css, no tailwind.config.js needed.
- **Recharts** requires `"use client"` — all chart pages must be client components.
- Generated Prisma client lives at `app/generated/prisma/` — import from `@/app/generated/prisma/client`.

## Database Schema
```
Member: id, phone (unique), name, ageGroup (string), gender (string), createdAt
CheckIn: id, memberId (FK), checkedInAt, serviceDate (YYYY-MM-DD string)
```

Valid `ageGroup` values: `CHILD`, `YOUTH`, `ADULT`, `SENIOR`
Valid `gender` values: `MALE`, `FEMALE`, `OTHER`

## File Structure
```
app/
  page.tsx                  — Check-in landing (phone entry) [client]
  layout.tsx                — Root layout
  globals.css               — Tailwind v4 import
  checkin/
    new/page.tsx            — Registration form for first-timers [client]
    success/page.tsx        — Confirmation screen [client]
  admin/
    page.tsx                — Admin login (passphrase) [client]
    dashboard/page.tsx      — Stats dashboard with 4 charts [client]
  api/
    checkin/route.ts        — POST: phone lookup → check-in or redirect to register
    checkin/register/route.ts — POST: create member + check-in
    admin/auth/route.ts     — POST: validate passphrase, set cookie
    admin/stats/route.ts    — GET: 4 aggregations for dashboard
  generated/prisma/         — Prisma 7 generated client (do not edit)
lib/
  prisma.ts                 — Prisma client singleton
prisma/
  schema.prisma
  migrations/
  dev.db                    — SQLite database file
```

## Check-in Flow
1. User enters phone → `POST /api/checkin`
2. If new member → redirect to `/checkin/new?phone=...`
3. Registration form → `POST /api/checkin/register` → creates Member + CheckIn
4. If returning member → creates CheckIn directly
5. If already checked in today → shows "already checked in" message
6. All paths → `/checkin/success?name=...`

## Dashboard Stats
All queries scoped by `?weeks=N` (default 12). Returns:
- `weeklyData` — per-Sunday total, firstTimers, returning
- `arrivalData` — check-in counts bucketed in 15-min slots
- `ageGroups` + `genders` — demographic pie chart data
- `summary` — thisWeek, lastWeek, totalAttendance, uniqueMembers

## Environment Variables
```
DATABASE_URL=file:./dev.db         # in .env (Prisma config)
ADMIN_PASSPHRASE=church-admin-2024 # in .env.local (change before deploy!)
```

## Build Status
- [x] Project scaffolded (Next.js 16, Tailwind v4, Prisma 7, Recharts)
- [x] Prisma schema created and migrated
- [x] All API routes written
- [x] All UI pages written
- [x] Prisma 7 Driver Adapter installed (`@prisma/adapter-better-sqlite3`) and wired up in `lib/prisma.ts`
- [x] TypeScript clean (`npx tsc --noEmit` passes)
- [x] Dev server tested end-to-end (all API flows verified)

## Remaining / Next Steps
- Test UI flows on a real mobile device
- Change `ADMIN_PASSPHRASE` before deploying to production
- Add `prisma/dev.db` to `.gitignore` before deploy (contains real data)
