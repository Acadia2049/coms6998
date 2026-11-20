import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { executePromptChain } from './engine.mjs';

// Synthetic configuration and fixed responses; no database or network access.
const snapshot = {
  schema_version: 1,
  captured_at: '2026-11-20T12:00:00.000Z',
  chain: { id: 1, name: 'Fictional warning revision', slug: 'synthetic-demo', description: null },
  steps: [
    { id: 1, position: 1, name: 'Draft', user_prompt_template: 'Draft a fictional warning from: {{input}}' },
    { id: 2, position: 2, name: 'Review', user_prompt_template: 'Review this warning for clarity: {{previous_output}}' },
    { id: 3, position: 3, name: 'Revise', user_prompt_template: 'Original idea: {{initial_input}}\nReview: {{input}}\nWrite the revised warning.' },
  ].map(step => ({
    ...step,
    llm_model_id: 1,
    model_name: 'Fixed mock responses',
    provider_model_id: 'mock-no-network',
    is_temperature_supported: false,
    system_prompt: 'This is fictional creative writing, not real safety advice.',
    temperature: null,
  })),
};

const outputs = [
  'If the departure board displays yesterday, wait beneath the clock until your train returns to today.',
  'Keep the departure-board detail, but make the action more concrete: leave the platform rather than wait.',
  'If the departure board displays yesterday, leave the platform. Return only when your train appears under today’s date.',
];

async function runDemo(failAt = null) {
  let calls = 0;
  let tick = 0;
  let finished = null;
  const journaledSteps = [];
  const submittedPrompts = [];
  const result = await executePromptChain({
    chainId: 1,
    initialInput: 'The departure board announces a train arriving yesterday.',
    now: () => (tick += 25), // Deterministic illustrative time, not measured latency.
    journal: {
      async beginRun() {
        return {
          runId: failAt ? 'synthetic-failed-run' : 'synthetic-completed-run',
          snapshot: structuredClone(snapshot),
        };
      },
      async recordStep(_runId, step) { journaledSteps.push(structuredClone(step)); },
      async finishRun(run) { finished = structuredClone(run); },
    },
    generator: {
      async generate(input) {
        calls += 1;
        submittedPrompts.push(input.userPrompt);
        if (calls === failAt) throw new Error('Simulated provider timeout');
        return { output: outputs[calls - 1], providerRequestId: null, inputTokens: null, outputTokens: null };
      },
    },
  });

  assert.deepEqual(finished, result, 'The final journal entry must match the returned result.');
  assert.deepEqual(journaledSteps, result.steps, 'The journal must retain every returned step.');
  assert.equal(submittedPrompts[1], `Review this warning for clarity: ${outputs[0]}`);
  if (failAt) {
    assert.equal(calls, 2, 'The third model call must not run after the second fails.');
    assert.equal(result.status, 'failed');
    assert.equal(result.finalOutput, outputs[0], 'A partial output is retained, not labeled completed.');
    assert.deepEqual(result.steps.map(step => step.status), ['completed', 'failed']);
  } else {
    assert.equal(calls, 3);
    assert.equal(result.status, 'completed');
    assert.equal(result.finalOutput, outputs[2]);
    assert.equal(submittedPrompts[2], `Original idea: ${result.initialInput}\nReview: ${outputs[1]}\nWrite the revised warning.`);
  }

  return {
    synthetic: true,
    note: 'Real extracted runner; mocked model and in-memory journal. Timings are illustrative. No participant data or API calls.',
    executionSnapshot: snapshot,
    modelCalls: calls,
    result,
  };
}

const outputDirectory = new URL('./traces/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });
for (const [filename, failAt] of [['completed.json', null], ['failed.json', 2]]) {
  const trace = await runDemo(failAt);
  await writeFile(new URL(filename, outputDirectory), `${JSON.stringify(trace, null, 2)}\n`);
  console.log(`${filename}: ${trace.result.status}, ${trace.modelCalls} model calls, all assertions passed`);
}
