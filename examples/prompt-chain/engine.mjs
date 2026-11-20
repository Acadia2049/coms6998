import { RUNNER_LIMITS } from "./config.mjs";
import { renderPromptTemplate } from "./templates.mjs";
function errorMessage(error) {
    return error instanceof Error ? error.message : "The model request failed.";
}
export async function executePromptChain({ chainId, initialInput, journal, generator, now = Date.now, }) {
    const normalizedInput = initialInput.trim();
    if (!normalizedInput)
        throw new Error("Initial input is required.");
    if (normalizedInput.length > RUNNER_LIMITS.maxInputCharacters) {
        throw new Error(`Initial input exceeds ${RUNNER_LIMITS.maxInputCharacters.toLocaleString()} characters.`);
    }
    const runStartedAt = now();
    const { runId, snapshot } = await journal.beginRun(chainId, normalizedInput);
    const steps = [...snapshot.steps].sort((left, right) => left.position - right.position);
    if (steps.length === 0 || steps.length > RUNNER_LIMITS.maxSteps) {
        throw new Error(`A runnable chain must contain 1–${RUNNER_LIMITS.maxSteps} active steps.`);
    }
    const results = [];
    let previousOutput = "";
    for (const [index, step] of steps.entries()) {
        const sequence = index + 1;
        const stepInput = sequence === 1 ? normalizedInput : previousOutput;
        let systemPrompt = null;
        let userPrompt = "";
        const stepStartedAt = now();
        try {
            const context = {
                input: stepInput,
                initialInput: normalizedInput,
                previousOutput,
            };
            systemPrompt = step.system_prompt
                ? renderPromptTemplate(step.system_prompt, context)
                : null;
            userPrompt = renderPromptTemplate(step.user_prompt_template, context);
            const remainingMs = RUNNER_LIMITS.maxRunDurationMs - (now() - runStartedAt);
            if (remainingMs <= 0)
                throw new Error("The chain exceeded its total execution timeout.");
            const generated = await generator.generate({
                model: step.provider_model_id,
                systemPrompt,
                userPrompt,
                temperature: step.is_temperature_supported ? step.temperature : null,
                timeoutMs: Math.min(RUNNER_LIMITS.stepTimeoutMs, remainingMs),
            });
            const output = generated.output.trim();
            if (!output)
                throw new Error("The model returned an empty text output.");
            const result = {
                sequence,
                stepId: step.id,
                stepName: step.name,
                modelId: step.llm_model_id,
                model: step.provider_model_id,
                systemPrompt,
                userPrompt,
                output,
                status: "completed",
                providerRequestId: generated.providerRequestId,
                inputTokens: generated.inputTokens,
                outputTokens: generated.outputTokens,
                durationMs: Math.max(0, now() - stepStartedAt),
                error: null,
            };
            await journal.recordStep(runId, result);
            results.push(result);
            previousOutput = output;
        }
        catch (error) {
            const message = errorMessage(error);
            const failed = {
                sequence,
                stepId: step.id,
                stepName: step.name,
                modelId: step.llm_model_id,
                model: step.provider_model_id,
                systemPrompt,
                userPrompt,
                output: null,
                status: "failed",
                providerRequestId: null,
                inputTokens: null,
                outputTokens: null,
                durationMs: Math.max(0, now() - stepStartedAt),
                error: message,
            };
            try {
                await journal.recordStep(runId, failed);
            }
            catch (recordError) {
                failed.error = `${message} Logging also failed: ${errorMessage(recordError)}`;
            }
            results.push(failed);
            const failedRun = {
                runId,
                chainId: snapshot.chain.id,
                chainName: snapshot.chain.name,
                status: "failed",
                initialInput: normalizedInput,
                finalOutput: previousOutput || null,
                durationMs: Math.max(0, now() - runStartedAt),
                steps: results,
                error: failed.error,
            };
            await journal.finishRun(failedRun);
            return failedRun;
        }
    }
    const completedRun = {
        runId,
        chainId: snapshot.chain.id,
        chainName: snapshot.chain.name,
        status: "completed",
        initialInput: normalizedInput,
        finalOutput: previousOutput,
        durationMs: Math.max(0, now() - runStartedAt),
        steps: results,
        error: null,
    };
    await journal.finishRun(completedRun);
    return completedRun;
}
