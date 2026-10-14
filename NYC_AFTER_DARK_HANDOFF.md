# NYC After Dark — Local Handoff

Updated: 2026-10-14 16:22 EDT (America/New_York)

## Current state

- Production source: `main` at `47fb2cb9edd1e2da2f51f67de4b07f13c1c2e7cc`
- Production URL: <https://coms6998-sand.vercel.app/>
- Commit-specific deployment: <https://coms6998-arvn2b5ms-coms-6998.vercel.app/>
- Current product snapshot: `2026.10.14.1`
- Snapshot tag: `snapshot-2026-10-14-week5-iteration`

## Canonical documentation

- Working instructions: [docs/USAGE.md](docs/USAGE.md)
- Current immutable record:
  [docs/versions/2026-10-14-week5-iteration/README.md](docs/versions/2026-10-14-week5-iteration/README.md)
- Exact model prompt:
  [docs/versions/2026-10-14-week5-iteration/prompts/rule-generation.md](docs/versions/2026-10-14-week5-iteration/prompts/rule-generation.md)
- UI captures:
  [docs/versions/2026-10-14-week5-iteration/ui/README.md](docs/versions/2026-10-14-week5-iteration/ui/README.md)

## Continue safely

- Do not delete legacy caption rows.
- Match both `challenge_date` and `challenge_text` in wall queries.
- Keep `OPENAI_API_KEY` server-only.
- Apply `20261013_allow_draft_regeneration.sql` before testing regeneration.
- Configure Supabase variables separately for Vercel Preview when Preview is
  expected to work.
- Add a new version directory for future snapshots; do not edit this snapshot
  after its tag is created.
