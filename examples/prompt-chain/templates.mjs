import { RUNNER_LIMITS } from "./config.mjs";
const TOKENS = {
    input: "input",
    initial_input: "initialInput",
    previous_output: "previousOutput",
};
export function renderPromptTemplate(template, context) {
    const rendered = template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (token, name) => {
        const key = TOKENS[name.toLowerCase()];
        return key ? context[key] : token;
    });
    if (rendered.length > RUNNER_LIMITS.maxRenderedPromptCharacters) {
        throw new Error(`Rendered prompt exceeds ${RUNNER_LIMITS.maxRenderedPromptCharacters.toLocaleString()} characters.`);
    }
    return rendered;
}
