# NYC After Dark — Local Handoff

Updated: 2026-10-15 01:17 EDT (America/New_York)

## Current state

- Production source: `main` at `6eba51b7e7f1737bbd9fac8a8f96f351e4db52ba`
- Production URL: <https://coms6998-sand.vercel.app/>
- Commit-specific deployment: <https://coms6998-onxuw2tvj-coms-6998.vercel.app/>
- Current product snapshot: `2026.10.15.1`
- Snapshot tag: `snapshot-2026-10-15-vote-undo-owner-delete`
- Latest Production status: successful at `2026-10-14 17:14:39 EDT`
- Deployment note: the same source commit was redeployed after correcting the
  Vercel environment configuration.

## Canonical documentation

- Working instructions: [docs/USAGE.md](docs/USAGE.md)
- Current immutable record:
  [docs/versions/2026-10-15-vote-undo-owner-delete/README.md](docs/versions/2026-10-15-vote-undo-owner-delete/README.md)
- Exact model prompt:
  [docs/versions/2026-10-15-vote-undo-owner-delete/prompts/rule-generation.md](docs/versions/2026-10-15-vote-undo-owner-delete/prompts/rule-generation.md)
- UI captures:
  [docs/versions/2026-10-15-vote-undo-owner-delete/ui/README.md](docs/versions/2026-10-15-vote-undo-owner-delete/ui/README.md)

## Continue safely

- Do not delete legacy caption rows.
- Match both `challenge_date` and `challenge_text` in wall queries.
- Keep `OPENAI_API_KEY` server-only.
- Apply `20261013_allow_draft_regeneration.sql` before testing regeneration.
- Apply `20261014_allow_vote_undo_and_owner_delete.sql` before testing vote
  removal or published-rule deletion.
- Configure Supabase variables separately for Vercel Preview when Preview is
  expected to work.
- Add a new version directory for future snapshots; do not edit this snapshot
  after its tag is created.
