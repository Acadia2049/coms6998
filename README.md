# NYC After Dark

After midnight, every place has rules.

NYC After Dark is a daily fictional survival-rule wall. Signed-in users write a
short human seed, use Gemini to expand it into an editable night notice, publish
it, and cast one `MAKE CANON` vote per rule. Each completed night's top three
rules appear in the seven-night archive.

The current generator uses `gemini-3.5-flash-lite` with minimal thinking. It
targets a concise 20–35 word rule, preserves the user's central action or
restriction, and lets an unpublished draft be regenerated in place.

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
supabase/migrations/20261013_allow_draft_regeneration.sql
```

The migration:

- extends `captions` with prompt, owner, challenge, publish, and score fields;
- creates one-vote-per-user `votes` rows;
- keeps drafts private and published captions public;
- prevents clients from forging another user's `user_id`;
- exposes vote totals without exposing voter identities.

The draft-regeneration policy allows an authenticated author to replace only
their own unpublished, zero-vote draft. Published rules remain immutable
through the generation endpoint.

The application stores a stable nightly scene ID in `challenge_text`. This
keeps legacy challenge content in the database without mixing it into the new
wall or Past Nights archive.

## Verification

```bash
npm run lint
npx next build --webpack
```

Before submitting, verify in an incognito window that public content is visible,
mutations require login, drafts stay private, and Vercel Deployment Protection
is disabled.
