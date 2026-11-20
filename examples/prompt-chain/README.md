# Prompt chain execution example

Run the execution core from NYC After Dark Prompt Chain Studio without setting up Supabase, administrator access, or an API key:

```bash
node examples/prompt-chain/demo.mjs
```

Run from the repository root with Node.js 22 or newer. No npm install is needed for this example. Re-running replaces the two generated example trace files.

## What it demonstrates

The real extracted runner executes a three-step chain: draft a fictional warning, review its clarity, then revise it using the review and original idea. A second run simulates a timeout at step two.

| Run | Expected behavior | Trace |
| --- | --- | --- |
| Completed | Three ordered calls; preceding output appears in the next rendered prompt | [completed.json](traces/completed.json) |
| Failed | Two calls; third step does not run; first output retained with failed run status | [failed.json](traces/failed.json) |

The script asserts output handoff, journal contents, final status, and stopping after failure. An assertion failure exits with an error.

**All example text and run records are synthetic.** The model returns fixed responses, the journal uses memory, and the clock is deterministic. Token counts and provider request IDs are null. These files are not production logs or measurements of model performance.

## Source provenance

`engine.mjs`, `templates.mjs`, and `config.mjs` are JavaScript translations of the corresponding TypeScript files in the Studio's `lib/runner/` directory at commit `093ca24bf0ec5dcb36115fc05f4a37a24f533e3b`.

The extraction removes TypeScript annotations and replaces the two runtime path aliases with relative imports. It does not change the execution logic. [provenance.json](provenance.json) records original source hashes, compiler version, and the transformation. `demo.mjs` is a new offline harness around that extracted code.

This example does not exercise the real model adapter, Supabase journal, authorization, or database immutability. Those are separate parts of the full Studio application. Its purpose is to make step execution and failure behavior easy to inspect.
