# Version Archive

This directory stores immutable product snapshots. Each snapshot records the
UI, source baseline, date, implemented behavior, AI model and request settings,
exact prompt, deployment target, and verification status.

| Version | Captured | Source baseline | Summary |
| --- | --- | --- | --- |
| [2026.10.15.1](2026-10-15-vote-undo-owner-delete/README.md) | 2026-10-15 01:17 EDT | `6eba51b` | Vote undo, owner deletion, and corrected production environment redeployment |
| [2026.10.14.1](2026-10-14-week5-iteration/README.md) | 2026-10-14 16:22 EDT | `47fb2cb` | Week 5 creation-flow, navigation, and responsive UI iteration |
| [2026.10.13.1](2026-10-13-openai-luna/README.md) | 2026-10-13 11:32 EDT | `3b49b54` | Notice-wall redesign and OpenAI Luna migration |

## Rules for future snapshots

1. Create a new directory; never overwrite an older snapshot.
2. Include desktop and mobile UI images captured from the deployed product.
3. Copy the exact production prompt and model request settings.
4. Record the full source commit and production URL.
5. Record known limitations honestly.
6. Add the new snapshot to the table above.
7. Create a Git tag after committing the snapshot.
