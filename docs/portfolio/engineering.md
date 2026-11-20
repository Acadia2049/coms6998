# NYC After Dark engineering walkthrough

NYC After Dark combines a public writing application with tools for administering content and configuring LLM workflows. I independently designed and implemented these applications for COMS 6998. The public writing flow demonstrates how an AI draft can remain under its author's control; the companion tools make generation configuration and execution inspectable.

## Human input and publication

The public application's [composer](../../app/components/SubmissionComposer.tsx) sends a human-written seed to the [generation route](../../app/api/generate/route.ts). That route validates the session and input, calls the model on the server, checks the generated notice's format, and saves it as an unpublished draft.

The writer can edit or regenerate this draft. Regeneration is scoped to an owned, unpublished draft for the current scene and original seed. The [publication route](../../app/api/submissions/%5Bid%5D/publish/route.ts) receives the edited text when the writer explicitly publishes it. Generated drafts are persisted, but intermediate manual edits are not independently saved or logged.

| Engineering concern | Implementation to inspect |
| --- | --- |
| Authentication, input validation, model timeout, draft persistence | `app/api/generate/route.ts` |
| Human seed, regeneration, editable draft, explicit publication | `app/components/SubmissionComposer.tsx` |
| Ownership and publication checks | `app/api/submissions/[id]/publish/route.ts` |
| Vote and undo behavior | `app/api/votes/route.ts` |
| Draft visibility and database permissions | `supabase/migrations/` |
| Prompt construction and scene selection | `lib/challenges.ts` |

## OAuth return paths

The callback only accepts local return paths. It rejects external URLs, protocol-relative paths, backslashes, and raw control characters. It also checks the normalized path so dot segments cannot turn a seemingly local destination into a new host when the redirect URL is constructed. Regression tests exercise successful and failed code exchanges without contacting the authentication provider.

## Generation records and data quality

After saving a generated draft, the public app calls `record_generation_observability`. It passes the caption identifier, human seed, generated output, system and user prompts, provider request identifier, duration, and input/output token counts. The RPC is defined in the companion Admin migration `20261028120000_add_week7_observability.sql`.

If that logging call fails, the draft still succeeds and the server emits a warning. This is a deliberate product-availability tradeoff, but it means the log cannot be treated as a complete denominator of generation attempts. Provider failures, timeouts, rejected output formats, and failed draft saves do not all receive persisted terminal records.

These records support inspection of successful generations. They do not establish which suggestions were shown, rejected, partially accepted, or edited at each moment. Publication and voting also should not be described as research measures of discourse quality without a defined measurement protocol.

## Prompt Chain Studio

Studio lets an authorized administrator configure an ordered sequence of model calls. Each step stores its model, system prompt, user prompt template, position, and applicable temperature setting. At run start, the journal returns a snapshot of the chain configuration. Execution uses that snapshot and sorts steps by their stored position.

The runner supplies three template variables:

| Variable | Meaning |
| --- | --- |
| `{{initial_input}}` | The run's original, trimmed input |
| `{{input}}` | Original input for the first step; preceding output for later steps |
| `{{previous_output}}` | Empty for the first step; preceding output thereafter |

Model output is trimmed before it is recorded and passed forward. Each step records rendered prompts, output, model, timing, token counts, status, and any error. A failed middle step stops subsequent model calls and retains the last successful output as a partial result with failed run status.

The [runnable example](../../examples/prompt-chain/README.md) extracts this execution logic and produces both a successful three-step trace and a failure trace. Its model responses and storage are mocked. It exercises the real sequencing and template code, but does not test database persistence, immutable snapshots in PostgreSQL, or live API behavior.

Studio source landmarks:

- `lib/runner/engine.ts`: sequential execution, time limits, journaling, and failure handling.
- `lib/runner/data.ts`: database journal adapter.
- `lib/runner/openai.ts`: server-side model adapter.
- `tests/runner-engine.component.test.ts`: ordering, handoff, invalid input, database-start failure, and middle-step failure cases.
- `supabase/migrations/20261031230000_add_prompt_chain_runner.sql`: execution snapshots and journal operations.

The public application does not invoke Studio's database-configured chains. Studio supports linear text-to-text execution, without branching, loops, or parallel steps.

## Admin authorization

The Admin application's request-scoped guard validates the session with Supabase Auth, checks the trusted Google identity, and reads `profiles.is_superadmin` through the caller's session. It does not trust a client-supplied administrator flag or use a service-role credential. Database RPCs separately enforce authorization before accessing cross-user records.

Two levels of evidence matter:

- `tests/authorization-policy.test.mjs` checks signed-out, non-Google, ordinary-user, authorized-user, and revoked-admin cases using injected dependencies.
- `tests/sql/admin-rpc-tests.sql` contains database checks for grants, authorization guards, ordinary-user rejection, and protected data access.

The policy tests passing does not by itself prove the database policies are correct. The SQL suite is a separate check against a temporary PostgreSQL database.

## Verification record

Local checks rerun on November 20, 2026:

| Component | Source revision | Check | Result |
| --- | --- | --- | --- |
| Prompt Chain Studio | `093ca24` | `npm test` | 8 unit tests and 22 component tests passed |
| Admin | `e2b7078` | `npm test` | 16 unit tests passed |

These counts belong to the companion applications. The public-app portfolio update adds nine OAuth regression tests, covering both return-path validation and the actual callback route with a mocked session exchange. All nine tests, the offline runner assertions, type checking, and the production build passed locally. Lint completed with two pre-existing image-element warnings and no errors. Next.js and eslint-config-next were updated to 16.4.6, and compatible transitive dependency fixes brought the npm audit result to zero known vulnerabilities on November 20, 2026. CI runs the tests, offline example, lint, type checking, and build on pull requests and main. The [workflow results](https://github.com/Acadia2049/coms6998/actions/workflows/ci.yml) record checks against each commit.

Database tests and authenticated production writing flows were not rerun for this update. The public signed-out homepage was opened successfully and captured on November 20.

## Adapting this experience to a field experiment

The transferable work is browser-based UI development, authenticated APIs, Supabase permissions, model integration, and inspectable execution. A research deployment would additionally require explicit consent, persistent participant assignment, versioned treatment prompts, and a defined event schema.

For example, suggestion exposure and acceptance would need distinct events tied to participant, assignment, session, suggestion, and prompt version. Data-quality checks would need to distinguish never-generated suggestions from lost exposure logs and unobserved acceptances. Those capabilities are future work, not features claimed by this application.
