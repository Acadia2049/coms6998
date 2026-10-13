import { NextResponse } from "next/server";

import {
    buildGenerationPrompt,
    extractSeedFromGenerationPrompt,
    getTonightChallenge,
    RULE_GENERATION_SYSTEM_INSTRUCTION,
} from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

const MIN_SEED_LENGTH = 10;
const MAX_SEED_LENGTH = 180;
const MIN_RESPONSE_WORDS = 15;
const MAX_RESPONSE_WORDS = 40;
const MAX_RESPONSE_LENGTH = 900;
const MAX_OUTPUT_TOKENS = 100;
const OPENAI_MODEL = "gpt-6-luna";
const OPENAI_TIMEOUT_MS = 6_000;
const OPENAI_SERVICE_TIER = process.env.OPENAI_SERVICE_TIER ?? "fast";

type OpenAIResponsePayload = {
    error?: { message?: string };
    output?: Array<{
        content?: Array<{
            type?: string;
            text?: string;
        }>;
    }>;
};

function extractOpenAIText(payload: OpenAIResponsePayload) {
    return payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((content) => content.type === "output_text")
        ?.text?.trim();
}

async function generateWithOpenAI(apiKey: string, prompt: string) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                reasoning: { effort: "none" },
                service_tier: OPENAI_SERVICE_TIER,
                instructions: RULE_GENERATION_SYSTEM_INSTRUCTION,
                input: prompt,
                max_output_tokens: MAX_OUTPUT_TOKENS,
                store: false,
            }),
            signal: controller.signal,
        });
        const payload = (await response.json()) as OpenAIResponsePayload;

        if (!response.ok) {
            throw new Error(
                `OpenAI ${response.status}: ${payload.error?.message ?? response.statusText}`
            );
        }

        const generatedText = extractOpenAIText(payload);

        if (generatedText) {
            return generatedText;
        }

        throw new Error(`${OPENAI_MODEL} returned an empty response.`);
    } catch (error) {
        console.warn(
            `OpenAI model ${OPENAI_MODEL} failed after ${Date.now() - startedAt}ms:`,
            error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function countEnglishWords(text: string) {
    return text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)?.length ?? 0;
}

function isPreferredLength(wordCount: number) {
    return wordCount >= MIN_RESPONSE_WORDS && wordCount <= MAX_RESPONSE_WORDS;
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Sign in to generate a response." }, { status: 401 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const rawSeed =
        typeof body === "object" && body !== null && "seed" in body
            ? (body as { seed?: unknown }).seed
            : "";
    const seed = typeof rawSeed === "string" ? rawSeed.trim() : "";

    if (seed.length < MIN_SEED_LENGTH || seed.length > MAX_SEED_LENGTH) {
        return NextResponse.json(
            {
                error: `Your rule seed must be between ${MIN_SEED_LENGTH} and ${MAX_SEED_LENGTH} characters.`,
            },
            { status: 400 }
        );
    }

    const rawDraftId =
        typeof body === "object" && body !== null && "draftId" in body
            ? (body as { draftId?: unknown }).draftId
            : null;
    const draftId = rawDraftId === null ? null : Number(rawDraftId);

    if (draftId !== null && (!Number.isSafeInteger(draftId) || draftId < 1)) {
        return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("OPENAI_API_KEY is not configured.");
        return NextResponse.json({ error: "AI generation is not configured." }, { status: 500 });
    }

    const challenge = getTonightChallenge();
    const prompt = buildGenerationPrompt(challenge, seed);

    if (draftId !== null) {
        const { data: existingDraft, error: draftError } = await supabase
            .from("captions")
            .select("id, prompt")
            .eq("id", draftId)
            .eq("user_id", user.id)
            .eq("challenge_date", challenge.date)
            .eq("challenge_text", challenge.id)
            .is("published_at", null)
            .maybeSingle();

        if (draftError) {
            console.error("Draft lookup failed:", draftError.message);
            return NextResponse.json({ error: "Could not load this draft." }, { status: 500 });
        }

        const existingSeed = existingDraft
            ? extractSeedFromGenerationPrompt(existingDraft.prompt ?? "")
            : "";

        if (!existingDraft || existingSeed !== seed) {
            return NextResponse.json(
                { error: "This draft cannot be regenerated from that rule seed." },
                { status: 409 }
            );
        }
    }

    try {
        const generatedText = await generateWithOpenAI(apiKey, prompt);
        const responseWordCount = countEnglishWords(generatedText);

        if (
            generatedText.length > MAX_RESPONSE_LENGTH ||
            !isPreferredLength(responseWordCount)
        ) {
            console.warn(
                `OpenAI returned an unusable notice (${generatedText.length} characters, ${responseWordCount} words).`
            );
            return NextResponse.json(
                { error: "The AI notice missed the required format. Please try again." },
                { status: 502 }
            );
        }

        const draftMutation = draftId === null
            ? supabase
                .from("captions")
                .insert({
                    text: generatedText,
                    prompt,
                    user_id: user.id,
                    challenge_date: challenge.date,
                    challenge_text: challenge.id,
                })
                .select("id, text")
                .single()
            : supabase
                .from("captions")
                .update({ text: generatedText })
                .eq("id", draftId)
                .eq("user_id", user.id)
                .eq("challenge_date", challenge.date)
                .eq("challenge_text", challenge.id)
                .is("published_at", null)
                .select("id, text")
                .maybeSingle();

        const { data: submission, error } = await draftMutation;

        if (error) {
            console.error("Draft save failed:", error.message);
            return NextResponse.json(
                { error: "The response was generated but could not be saved. Please try again." },
                { status: 500 }
            );
        }

        if (!submission) {
            return NextResponse.json(
                { error: "This draft is no longer available." },
                { status: 409 }
            );
        }

        return NextResponse.json({ submission, seed });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return NextResponse.json(
                { error: "AI generation took too long. Please try again." },
                { status: 504 }
            );
        }

        console.error(
            "OpenAI generation failed:",
            error instanceof Error ? error.message : "Unknown error"
        );
        return NextResponse.json(
            { error: "The night is being mysterious. Try generating again." },
            { status: 502 }
        );
    }
}
