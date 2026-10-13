# NYC After Dark — Local Handoff

Updated: 2026-10-13 01:21 EDT (America/New_York)

## Saved checkpoint

- Commit branch: `feature/night-rules-redesign`
- Checkpoint tag: `checkpoint-2026-10-13-0121-edt`
- Scope: short rules-horror generation, seed-faithful prompting, and replaceable
  private drafts
- To inspect this exact version later without changing the current branch:
  `git switch --detach checkpoint-2026-10-13-0121-edt`
- To resume work from it safely on a new branch:
  `git switch -c restore-night-rules checkpoint-2026-10-13-0121-edt`

## Current product

NYC After Dark is a nightly fictional survival-rule wall:

1. Read tonight's NYC location and incident.
2. Sign in with Google through Supabase Auth.
3. Write one 10–180 character rule seed.
4. Gemini generates a concise 20–35 word fictional notice.
5. The notice is immediately saved as a private draft.
6. Edit, regenerate in place, or publish it to tonight's wall. Regeneration
   replaces the same unpublished draft; publishing clears the composer.
7. Cast one `MAKE CANON` vote per rule.
8. The top three rules from each of the last seven nights appear in Past Nights.

The number-one archived rule is labeled `NIGHT'S PRIMARY RULE`. Past Nights is
read-only. Legacy challenge rows remain in Supabase but are excluded by the new
stable scene IDs.

## Safety and Git

- Baseline tag: `pre-survival-rules-2026-10-13`
- Current checkpoint tag: `checkpoint-2026-10-13-0121-edt`
- Feature branch: `feature/night-rules-redesign`
- Draft regeneration policy: `20261013_allow_draft_regeneration.sql`
- Do not delete legacy caption rows.
- New wall queries must match both `challenge_date` and `challenge_text`.

## Application contracts

- `POST /api/generate`
  - Body: `{ seed, draftId? }`
  - Requires authentication.
  - Inserts a private draft or regenerates the current private draft.
  - Uses `gemini-3.5-flash-lite`, `MINIMAL` thinking, and a 180-token output
    budget.
  - Keeps invariant style and seed-fidelity rules in `systemInstruction`.
  - Requests one automatic rewrite only when output falls outside the server's
    15–45 word acceptance range.
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
- Authenticated Gemini generation and in-place draft regeneration succeeded
- Latest regeneration test: 26 words in 1.976 seconds with no format-repair
  retry

The complete Gemini → draft → publish → second-account vote flow still needs a
final live production test before submission.
