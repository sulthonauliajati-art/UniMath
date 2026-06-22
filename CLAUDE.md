# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

UniMath is a gamified numeracy practice platform for Indonesian students (grades 4-6). Students answer math questions to help a robot character climb a building (unlimited floors). Built as a monorepo with pnpm workspaces.

**Tech stack:** Next.js 14 (App Router), TypeScript, Turso (libSQL/SQLite) + Drizzle ORM, Tailwind CSS, Framer Motion.

## Monorepo structure

```
unimath/
├── apps/web/          # Next.js 14 app (the entire application)
│   ├── src/app/       # App Router: pages + API routes (colocated)
│   │   ├── admin/     # /admin/* — CMS for materials, questions, users
│   │   ├── teacher/   # /teacher/* — dashboard, classes, student reports
│   │   ├── student/   # /student/* — dashboard, practice, test, achievements
│   │   ├── setup/     # /setup — first-time admin creation
│   │   ├── maintenance/ # maintenance page
│   │   └── api/       # All API routes (Next.js Route Handlers)
│   ├── src/components/
│   │   ├── ui/        # Reusable: NeonButton, Modal, Toast, Input, LoadingScreen, ProgressBar
│   │   ├── game/      # TowerBuilding, GameRobot, StairPlatform
│   │   └── unimate/   # Page-level components for the practice experience
│   ├── src/lib/
│   │   ├── db/        # Drizzle schema (schema.ts), client, seeds, imports
│   │   ├── auth/      # AuthProvider context + bcrypt/token utilities
│   │   ├── api/       # Shared API client utilities
│   │   └── email/     # Resend email sender
│   ├── src/styles/    # Global CSS with CSS custom properties
│   └── vercel.json    # Deployed to Vercel (sin1 region, 30s function timeout)
├── docs/              # API docs, blueprint, progress tracking
├── scripts/           # Utility scripts
└── bank-soal-final/   # Final question bank data
```

## Commands

All commands run from the repo root (`D:\UniMath\`):

```bash
pnpm dev              # Start Next.js dev server (port 3000)
pnpm build            # Production build
pnpm lint             # ESLint

# Database (run from within apps/web or use pnpm --filter)
cd apps/web
npx drizzle-kit push                        # Push schema to DB
npx drizzle-kit studio                      # Open Drizzle visual studio
npx tsx src/lib/db/seed.ts                 # Seed demo data
npx tsx src/lib/db/seed-achievements.ts     # Seed achievement badges
npx tsx src/lib/db/import-practice.ts      # Import practice questions
npx tsx src/lib/db/generate-test-questions.ts  # Generate test questions from practice
```

To run from root via pnpm filter (same commands, prefixed):
```bash
pnpm --filter @unimath/web db:push
pnpm --filter @unimath/web db:seed
```

## Architecture decisions

### Dual-mode test/practice separation
The system enforces strict separation between **Practice** (gamified, hints allowed, adaptive difficulty) and **Test** (Pretest/Posttest — no hints, no feedback, sterile UI). These use separate DB tables (`practice_sessions`/`practice_attempts` vs `test_sessions`/`test_attempts`) and separate API routes (`/api/practice/*` vs `/api/test/*`). During tests, the API deliberately does NOT return `isCorrect` to the client — this is critical for research validity.

### Adaptive difficulty (practice only)
Server-authoritative streak-based difficulty:
- 2+ consecutive correct → difficulty increases (Mudah → Sedang → Sulit, max 3)
- 2+ consecutive wrong → difficulty decreases (Sulit → Sedang → Mudah, min 1)
- Question selection: single DB query per material, then filter in-memory (avoids multiple round-trips)

### Remedial flow ("Wajib Belajar")
After 3 consecutive wrong answers, the session status becomes `REMEDIAL_REQUIRED`. The student is forced into a locked modal showing learning content + a checkpoint question. No "X" close button — must complete the checkpoint to resume. See `/api/practice/answer` route for the trigger logic (lines 270-296).

### Auth system
- Token-based: tokens stored in `auth_tokens` table, validated on every request
- Tokens live in localStorage + cookies (for middleware/server access)
- Middleware (`src/middleware.ts`) does role-based routing: `/admin/*`, `/teacher/*`, `/student/*` guard by cookie
- Login routes are public; all other role-prefixed routes require auth
- NISN-based student identification (2-step: identify by NISN, then login with password)

### Maintenance mode
Toggle `NEXT_PUBLIC_MAINTENANCE_MODE=true` to redirect all users to `/maintenance`. Admins can bypass with `?bypass=<key>` query param (gets a cookie for 8 hours). API routes under `/api/admin` remain accessible.

### Database
Turso (distributed libSQL) with Drizzle ORM. The schema is in a single file: `src/lib/db/schema.ts`. Key indexes are documented inline with `⚡ CRITICAL` comments — they support hot-path queries (fetching questions by material/difficulty/mode, finding active sessions, token validation). SQLite's single-writer constraint is handled with a `withRetry()` helper in practice answer routes.

### Question metadata for research
Questions carry:
- `mode`: `PRACTICE`, `PRETEST`, `POSTTEST`, or `ALL`
- `indicator`: `I1` through `I4` — numeracy indicators for thesis analysis
- `difficulty`: 1-3 (Mudah/Sedang/Sulit)
- `hint1`/`hint2`/`hint3`: progressive hints
- `optA` through `optE`: all 5 answer choices
- `correct`: the correct answer (A-E, always returned)

### Design system
Glassmorphism dark theme with CSS custom properties (defined in global CSS, referenced via Tailwind `uni-*` utility classes). Colors: dark navy background, cyan primary, teal accent. Fonts: Poppins + Inter. Animations via Framer Motion.

## Key patterns

- **API responses** follow `{ data, error: { code, message } }` shape (see `ApiResponse<T>` in types)
- **API routes** are Next.js Route Handlers — no separate server, no tRPC
- **Session management** for practice is server-authoritative: floor, streak, difficulty all live in `practice_sessions` table, never just in browser storage
- **Question rotation**: tracks used question IDs in-memory from the last 100 attempts per session, avoids repeats
- **XP calculation**: server-side only, streak multiplier (1x base, 1.5x at 3-streak, 2x at 5-streak, 3x at 10-streak), persisted in both `practice_attempts.xp_awarded` and `users.total_points`
- **Material contents**: separate `material_contents` table with SHORT/FULL variants per material, holding markdown bodies, learning objectives, formulas, steps, examples, checkpoint items
