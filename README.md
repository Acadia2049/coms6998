# NYC After Dark

Every night, NYC gives you an assignment.

NYC After Dark is a daily AI-assisted creative challenge for Columbia students
and other chronically online New Yorkers. Signed-in users can generate a
response, edit and publish it, browse the public wall, and leave one FIRE vote
on each response.

## Stack

- Next.js App Router and React
- Supabase Auth, Postgres, Row Level Security, and Storage
- Google Gemini via the server-only `@google/genai` SDK
- Vercel deployment

## Local setup

Copy `.env.example` to `.env.local` and provide:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
GEMINI_API_KEY=...
```

`GEMINI_API_KEY` must remain server-only. Never prefix it with `NEXT_PUBLIC_`.

Install dependencies and run the app:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Database

The Week 4 schema and RLS policies live in:

```text
supabase/migrations/20261007_week4_nyc_after_dark.sql
```

The migration:

- extends `captions` with prompt, owner, challenge, publish, and score fields;
- creates one-vote-per-user `votes` rows;
- keeps drafts private and published captions public;
- prevents clients from forging another user's `user_id`;
- exposes vote totals without exposing voter identities.

## Verification

```bash
npm run lint
npx next build --webpack
```

Before submitting, verify in an incognito window that public content is visible,
mutations require login, drafts stay private, and Vercel Deployment Protection
is disabled.
