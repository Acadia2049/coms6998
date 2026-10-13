# NYC After Dark

After midnight, every place has rules.

NYC After Dark is a daily fictional survival-rule wall. A signed-in visitor
writes a short human seed, OpenAI shapes it into an editable night notice, and
the community votes on which rules become canon.

## Current release

- Product snapshot: `2026.10.13.1`
- Model: `gpt-6-luna`
- Production: <https://coms6998-coms-6998.vercel.app/>
- Source baseline: `3b49b545291c6fd008c36d1c30ebb6b8ae3a7795`

## Documentation

- [Usage, setup, deployment, and troubleshooting](docs/USAGE.md)
- [Version archive](docs/versions/README.md)
- [Current UI and AI snapshot](docs/versions/2026-10-13-openai-luna/README.md)
- [Current rule-generation prompt](docs/versions/2026-10-13-openai-luna/prompts/rule-generation.md)
- [Local handoff](NYC_AFTER_DARK_HANDOFF.md)

## Stack

- Next.js App Router and React
- Supabase Auth, Postgres, Row Level Security, and Storage
- OpenAI Responses API
- Vercel

The README is intentionally short. Operational instructions live in
`docs/USAGE.md`; immutable UI, model, prompt, feature, and verification records
live under `docs/versions/`.
