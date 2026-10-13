# NYC After Dark — Local Handoff

Updated: 2026-10-13 11:32 EDT (America/New_York)

## Current state

- Production source: `main` at `3b49b545291c6fd008c36d1c30ebb6b8ae3a7795`
- Production URL: <https://coms6998-coms-6998.vercel.app/>
- Current product snapshot: `2026.10.13.1`
- Snapshot tag: `snapshot-2026-10-13-openai-luna`

## Canonical documentation

- Working instructions: [docs/USAGE.md](docs/USAGE.md)
- Current immutable record:
  [docs/versions/2026-10-13-openai-luna/README.md](docs/versions/2026-10-13-openai-luna/README.md)
- Exact model prompt:
  [docs/versions/2026-10-13-openai-luna/prompts/rule-generation.md](docs/versions/2026-10-13-openai-luna/prompts/rule-generation.md)
- UI captures:
  [docs/versions/2026-10-13-openai-luna/ui/README.md](docs/versions/2026-10-13-openai-luna/ui/README.md)

## Continue safely

- Do not delete legacy caption rows.
- Match both `challenge_date` and `challenge_text` in wall queries.
- Keep `OPENAI_API_KEY` server-only.
- Apply `20261013_allow_draft_regeneration.sql` before testing regeneration.
- Configure Supabase variables separately for Vercel Preview when Preview is
  expected to work.
- Add a new version directory for future snapshots; do not edit this snapshot
  after its tag is created.
