# NYC After Dark — Local Handoff

Updated: 2026-10-07

This file is a factual project handoff. The new conversation's user request remains authoritative.

## Project location

`/Users/liushilin/Desktop/哥大/2026 fall/6998/coms6998`

Current branch: `main`

The working tree intentionally contains uncommitted Week 4 work. Do not discard, reset, commit, or push it unless the user explicitly asks.

## Current product

NYC After Dark is a daily NYC / Columbia creative challenge app:

1. Read tonight's challenge.
2. Sign in with Google through Supabase Auth.
3. Click `PICK UP THE CAN`.
4. Optionally enter an angle and click `SPRAY IT`.
5. Gemini generates a private draft, which is immediately saved to Supabase.
6. Edit the draft and click `PUT IT ON THE WALL`.
7. Browse community submissions and vote with `FIRE`.

Generate, draft, publish, vote, authentication, Supabase mutations, and RLS were tested successfully before the latest UI-only refinements.

## Technology

- Next.js 16.4 App Router
- React 19
- TypeScript
- Supabase Auth, database, RLS, and SSR clients
- Google Gemini through `@google/genai`
- Custom CSS in `app/globals.css`
- No animation or graffiti drawing library

Environment values are stored in `.env.local`. Do not print or copy their secret values into chat or this file.

## Important application contracts

- `POST /api/generate`
  - Body: `{ angle }`
  - Creates an authenticated private row in `captions` with the prompt and AI output.
- `PATCH /api/submissions/[id]/publish`
  - Body: `{ text }`
  - Publishes the authenticated user's draft.
- `POST /api/votes`
  - Body: `{ captionId }`
  - Inserts an authenticated vote and returns the updated score.

Do not change these contracts, Supabase schema, RLS, authentication flow, or the Generate → Draft → Publish → Vote product flow during frontend iteration.

## Database objects currently used

- `profiles`
- `captions`
- `votes`

Relevant SQL/migrations are under `supabase/`. They have already been applied in Supabase.

## Current visual direction

The homepage is intentionally a dark NYC wall rather than a standard SaaS page:

- Charcoal concrete base
- Dirty off-white wheatpaste paper
- Hot pink primary accent
- Small cyan print offset accents
- Readable editorial typography
- Controlled torn paper, print grain, stencil, sticker, and halftone treatment
- Small irregular community posters rather than a uniform card grid
- Mobile submissions collapse to one column

The unused right-side `TONIGHT / MAKE NOISE` decoration was removed.

## Current frontend interactions

- `PICK UP THE CAN`
  - Real button CTA
  - Short spray-particle effect
  - Reveals the compact composer
  - Smoothly scrolls to and focuses the angle textarea
- `SPRAY IT`
  - Short spray-particle effect
  - Shows `SPRAYING...` for the Gemini request
  - Reveals the returned draft with a short stencil animation
- Publish
  - Keeps the existing database mutation
  - Refreshes the server-rendered wall
  - Finds the new card through `data-caption-id`
  - Smoothly scrolls to it
  - Temporarily displays `ON THE WALL ✓`
- Vote
  - Keeps the existing database mutation
  - Displays the existing `FIRE / STAMPED` interaction and brief FIRE stamp

The Gemini prompt already limits responses to 280 characters, so it was not changed during the latest UI pass.

## Gemini latency note

On 2026-10-07, local server logs and direct API checks confirmed repeated `503 UNAVAILABLE`
high-demand responses from `gemini-3.8-flash`. The generation route now uses
`gemini-3.5-flash-lite` with minimal thinking, a 10-second request timeout, and at most two
short-delay attempts. This preserves the existing `/api/generate` contract and database flow
while preventing the UI from waiting through the SDK's default five long retries.

Direct checks showed that Google capacity was still intermittent: 3.5 Flash-Lite succeeded in
one representative request and later returned a bounded 503. No alternate provider key is
currently configured, so DeepSeek was not added.

## Main frontend files

- `app/page.tsx`
  - Server-side homepage data and page composition
- `app/globals.css`
  - Homepage wall, responsive layout, paper media, and animations
- `app/components/SubmissionComposer.tsx`
  - Pick-up, generate, draft, publish interactions
- `app/components/CaptionCard.tsx`
  - Submission media and `data-caption-id`
- `app/components/VoteButton.tsx`
  - Vote mutation and stamp feedback

Other important files:

- `app/api/generate/route.ts`
- `app/api/submissions/[id]/publish/route.ts`
- `app/api/votes/route.ts`
- `lib/challenges.ts`
- `lib/supabase/`
- `proxy.ts`
- `supabase/`

## Local development and verification

The current dev server was running at:

`http://localhost:3000`

Before starting another server, check whether that URL already responds. If it is not running:

```bash
npm run dev
```

Latest verification:

- Homepage responded successfully at localhost.
- `npm run lint` passed with only two pre-existing `@next/next/no-img-element` warnings in `ProfilePhotoUpload.tsx` and `app/dashboard/page.tsx`.
- `npx tsc --noEmit` passed.
- `npm run build -- --webpack` passed.
- The default Turbopack build encountered an environment-level internal port-binding error during one run; the Webpack production build completed successfully.

## Current Git state

There are multiple modified and untracked files from the completed Week 4 implementation and UI work. They are intentional local work. Do not use destructive Git commands.

No commit or push was performed for the latest work, per the user's request.
