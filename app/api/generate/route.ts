import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";

import { buildGenerationPrompt, getTonightChallenge } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

const MIN_SEED_LENGTH = 10;
const MAX_SEED_LENGTH = 180;
const MIN_RESPONSE_WORDS = 40;
const MAX_RESPONSE_WORDS = 90;
const MAX_RESPONSE_LENGTH = 900;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_TIMEOUT_MS = 10_000;

async function generateWithGemini(ai: GoogleGenAI, prompt: string) {
    const startedAt = Date.now();

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                maxOutputTokens: 180,
                thinkingConfig: {
                    thinkingLevel: ThinkingLevel.MINIMAL,
                },
                httpOptions: {
                    timeout: GEMINI_TIMEOUT_MS,
                    retryOptions: {
                        attempts: 1,
                        initialDelay: 0.5,
                        maxDelay: 0.5,
                    },
                },
            },
        });

        if (response.text?.trim()) {
            return response.text.trim();
        }

        throw new Error(`${GEMINI_MODEL} returned an empty response.`);
    } catch (error) {
        console.warn(
            `Gemini model ${GEMINI_MODEL} failed after ${Date.now() - startedAt}ms:`,
            error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
    }
}

function countEnglishWords(text: string) {
    return text.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)?.length ?? 0;
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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY is not configured.");
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

        if (!existingDraft || existingDraft.prompt !== prompt) {
            return NextResponse.json(
                { error: "This draft cannot be regenerated from that rule seed." },
                { status: 409 }
            );
        }
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const generatedText = await generateWithGemini(ai, prompt);
        const responseWordCount = countEnglishWords(generatedText);

        if (
            !generatedText ||
            generatedText.length > MAX_RESPONSE_LENGTH ||
            responseWordCount < MIN_RESPONSE_WORDS ||
            responseWordCount > MAX_RESPONSE_WORDS
        ) {
            console.warn(
                `Gemini returned an invalid notice (${generatedText.length} characters, ${responseWordCount} words).`
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
        console.error(
            "Gemini generation failed:",
            error instanceof Error ? error.message : "Unknown error"
        );
        return NextResponse.json(
            { error: "The night is being mysterious. Try generating again." },
            { status: 502 }
        );
    }
}
