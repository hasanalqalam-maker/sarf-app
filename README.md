# Sarf App

An Arabic ṣarf (morphology) learning app built from the **FSTU Sarf 2023** textbook —
conjugation reference, textbook exercises, and practice games, unit by unit.
Students track their own progress; teachers can follow their students'.

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3
- **Backend:** Supabase (Postgres + Auth + RLS)

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in the Supabase values
npm run dev                     # http://localhost:3000
```

### Environment

| Variable | Required | Used by |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | app + scripts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | app + scripts |
| `SUPABASE_SERVICE_ROLE_KEY` | no | `scripts/` only — never the app |

### Database

Migrations live in `supabase/migrations/` and are applied in order (SQL Editor
in the Supabase dashboard, or `supabase db push`):

| File | Adds |
| --- | --- |
| `001_initial_schema.sql` | `profiles` + progress tables, RLS, new-user trigger |
| `002_persist_role_and_profile_insert_policy.sql` | trigger persists `role`; profile self-insert fallback |
| `003_progress_sync.sql` | upsert keys + `user_stats` for progress sync |
| `004_add_student_by_email.sql` | `add_student_by_email` RPC for the teacher roster |

### Auth configuration

In the Supabase dashboard → **Authentication → URL Configuration → Redirect URLs**,
add the origins the email links return to:

```
http://localhost:3000/**
https://<your-production-domain>/**
```

Email confirmation is on: sign-up sends a link to `/auth/callback`, which
exchanges it for a session. Password reset works the same way via
`/reset-password`.

## Scripts

`npm run dev` · `npm run build` · `npm run start`

`scripts/` holds standalone verification scripts (auth, progress sync, teacher
roster). They hit the live Supabase project and need `SUPABASE_SERVICE_ROLE_KEY`
set:

```bash
node scripts/test-auth-signup.mjs
node scripts/test-progress-sync.mjs
node scripts/test-teacher-roster.mjs
```

## Layout

```
src/app/            routes (App Router)
  exercises/        exercise + game hubs, per unit
  reference/        conjugation tables
  progress/         personal progress
  students/         teacher roster + per-student view
  auth/callback/    email-link handler
src/components/     UI (layout, games, exercises, shared)
src/lib/            data access + domain logic
src/context/        AuthContext
data/               textbook-derived JSON (bābs, conjugations, exercises)
supabase/migrations SQL schema
```

## Deployment (Vercel)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project's
environment variables, add the production URL to the Supabase redirect list
(above), and deploy. `vercel.json` already pins the framework and build command.
