# NYC After Dark — Local Handoff

Updated: 2026-10-13

## Current product

NYC After Dark is a nightly fictional survival-rule wall:

1. Read tonight's NYC location and incident.
2. Sign in with Google through Supabase Auth.
3. Write one 10–180 character rule seed.
4. Gemini generates a 40–90 word fictional notice.
5. The notice is immediately saved as a private draft.
6. Edit, regenerate, or publish it to tonight's wall.
7. Cast one `MAKE CANON` vote per rule.
8. The top three rules from each of the last seven nights appear in Past Nights.

The number-one archived rule is labeled `NIGHT'S PRIMARY RULE`. Past Nights is
read-only. Legacy challenge rows remain in Supabase but are excluded by the new
stable scene IDs.

## Safety and Git

- Baseline tag: `pre-survival-rules-2026-10-13`
- Feature branch: `feature/night-rules-redesign`
- No schema migration was added for this redesign.
- Do not delete legacy caption rows.
- New wall queries must match both `challenge_date` and `challenge_text`.

## Application contracts

- `POST /api/generate`
  - Body: `{ seed, draftId? }`
  - Requires authentication.
  - Inserts a private draft or regenerates the current private draft.
- `PATCH /api/submissions/[id]/publish`
  - Body: `{ text }`
  - Only publishes the current user's draft for tonight's scene.
- `POST /api/votes`
  - Body: `{ captionId }`
  - Only accepts a published rule on tonight's wall.

## Key files

- `lib/challenges.ts`: fourteen structured scenes and New York date rotation
- `app/page.tsx`: dual-column homepage and current wall query
- `app/past-nights/page.tsx`: read-only seven-night top-three archive
- `app/api/generate/route.ts`: Gemini prompt, validation, and draft persistence
- `app/components/SubmissionComposer.tsx`: seed, draft, regenerate, and publish UI
- `app/components/CaptionCard.tsx`: fictional rule notice card
- `app/components/VoteButton.tsx`: Make Canon interaction
- `app/night.css`: notice-wall visual system and responsive layout
- `app/globals.css`: legacy and profile/dashboard styles

## Verification

Completed after the redesign:

- `npx tsc --noEmit`
- `npm run lint` (two pre-existing `no-img-element` warnings)
- `npm run build -- --webpack`
- HTTP 200 for `/` and `/past-nights`
- Browser QA at 1440px and 390px with no horizontal overflow
- Browser console contained no errors

The authenticated Gemini → draft → publish → second-account vote flow still
needs a final live test before deployment.
