# NYC After Dark — Usage and Operations

This file is the working guide for using, running, testing, and deploying the
application. Historical facts belong in `docs/versions/`; the repository root
README remains a short product index.

## Use the product

Production URL: <https://coms6998-sand.vercel.app/>

1. Browse Tonight's Wall without signing in.
2. Select **Continue with Google** to authenticate through Supabase.
3. Enter one 10–180 character rule seed.
4. Generate a private AI draft.
5. Edit the draft or regenerate it in place.
6. Publish the draft when it is ready. Published rules cannot be regenerated.
7. Cast one **Make Canon** vote per published rule.
8. Open **Past Nights** to view the top three rules from each of the previous
   seven NYC nights.

## Local setup

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
OPENAI_API_KEY=...
OPENAI_SERVICE_TIER=fast
```

`OPENAI_API_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.
Use `OPENAI_SERVICE_TIER=default` if Fast processing is not enabled for the
OpenAI project.

Install and run:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Database setup

Apply the migrations in order:

```text
supabase/migrations/20261007_week4_nyc_after_dark.sql
supabase/migrations/20261013_allow_draft_regeneration.sql
```

The schema stores private drafts, published captions, nightly scenes, and
one-vote-per-user rows. Row Level Security keeps drafts private, prevents users
from changing another author's data, and permits only an author to replace an
unpublished zero-vote draft.

New wall queries must match both `challenge_date` and the stable scene ID in
`challenge_text`. Do not delete legacy caption rows.

## Verification

Run before deploying:

```bash
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

Then verify:

- `/` and `/past-nights` render publicly;
- unauthenticated `POST /api/generate` returns `401`;
- a signed-in user can generate, edit, regenerate, and publish a draft;
- a second account can vote once and cannot vote twice;
- private drafts never appear on the public wall;
- desktop and mobile layouts do not create unwanted horizontal overflow.

## Vercel deployment

The production branch is `main`. A push to `main` triggers a Production
deployment through the Vercel Git integration.

Configure every required variable for the intended Vercel environment. Vercel
treats Production and Preview as separate scopes; a Preview deployment can
return a server error even when Production works if the Supabase variables are
configured only for Production.

The stable project URL is:

```text
https://coms6998-sand.vercel.app/
```

The archived `https://coms6998-coms-6998.vercel.app/` alias remains reachable,
but `https://coms6998-sand.vercel.app/` is the current canonical production URL.

## Common failures

- `401 Sign in to generate a response`: expected when no Supabase session is
  present.
- `500 AI generation is not configured`: `OPENAI_API_KEY` is missing from the
  active deployment environment.
- Preview root returns `500`: confirm both public Supabase variables exist in
  the Preview scope, then redeploy.
- Generation succeeds but regeneration cannot save: apply
  `20261013_allow_draft_regeneration.sql` to the active Supabase project.
- `504 AI generation took too long`: the six-second server timeout was reached;
  retry once and inspect Vercel/OpenAI latency if it repeats.

## Canonical implementation files

- `app/api/generate/route.ts`: model request, validation, and draft persistence
- `lib/challenges.ts`: nightly scenes and prompt definitions
- `app/components/SubmissionComposer.tsx`: create, regenerate, edit, publish UI
- `app/page.tsx`: homepage and Tonight's Wall
- `app/past-nights/page.tsx`: seven-night archive
- `app/night.css`: primary visual system and responsive layout
- `supabase/migrations/`: schema and Row Level Security history
