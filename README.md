# NYC After Dark

After midnight, every place has rules.

NYC After Dark is a daily fictional survival-rule wall. A signed-in visitor
writes a short human seed, OpenAI shapes it into an editable night notice, and
the community votes on which rules become canon.

## Current release

- Product snapshot: `2026.10.15.1`
- Model: `gpt-6-luna`
- Production: <https://coms6998-sand.vercel.app/>
- Source baseline: `6eba51b7e7f1737bbd9fac8a8f96f351e4db52ba`

## Documentation

- [Usage, setup, deployment, and troubleshooting](docs/USAGE.md)
- [Version archive](docs/versions/README.md)
- [Current UI and AI snapshot](docs/versions/2026-10-15-vote-undo-owner-delete/README.md)
- [Current rule-generation prompt](docs/versions/2026-10-15-vote-undo-owner-delete/prompts/rule-generation.md)
- [Local handoff](NYC_AFTER_DARK_HANDOFF.md)

## Stack

- Next.js App Router and React
- Supabase Auth, Postgres, Row Level Security, and Storage
- OpenAI Responses API
- Vercel

The README is intentionally short. Operational instructions live in
`docs/USAGE.md`; immutable UI, model, prompt, feature, and verification records
live under `docs/versions/`.
