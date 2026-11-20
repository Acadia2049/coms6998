export const RUNNER_LIMITS = {
    maxInputCharacters: 4_000,
    maxRenderedPromptCharacters: 32_000,
    maxSteps: 10,
    maxOutputTokensPerStep: 1_200,
    stepTimeoutMs: 45_000,
    maxRunDurationMs: 240_000,
};
export function areRunnerWritesEnabled() {
    return process.env.WEEK8_RUNNER_WRITES_ENABLED === "true";
}
export function isOpenAIConfigured() {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
}
