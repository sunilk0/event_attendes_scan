<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Rules for This Project

## Before Writing Any Code
1. Read `CLAUDE.md` — it has the full project context, tech stack warnings, file structure, and build status.
2. Read `node_modules/next/dist/docs/01-app/` for Next.js 16 API if unfamiliar.
3. Check the **Build Status** section in CLAUDE.md to understand what is done and what is blocked.

## Critical Gotchas
- **Prisma 7**: Requires a Driver Adapter. Do NOT write `new PrismaClient()` without an adapter. Check `lib/prisma.ts` for the current pattern.
- **params/searchParams**: These are Promises in Next.js 16. Always `await` them in server components.
- **Recharts**: Always `"use client"` in any file that imports from recharts.
- **Tailwind v4**: No config file. Use standard utility classes only.
- **Generated Prisma**: Lives in `app/generated/prisma/`. Never edit it. Regenerate with `npx prisma generate` after schema changes.

## Workflow
- After any schema change: `npx prisma migrate dev --name <description>` then `npx prisma generate`
- Type check before reporting done: `npx tsc --noEmit`
- Admin passphrase is in `.env.local` — never commit this file

## What This App Does
Church fellowship attendance tracker. Members check in via phone number on their own smartphones. Admin views attendance trends on a password-protected dashboard. See CLAUDE.md for full details.
