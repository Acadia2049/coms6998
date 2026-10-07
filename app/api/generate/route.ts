import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";

import { buildGenerationPrompt, getTonightChallenge } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

const MAX_ANGLE_LENGTH = 280;
const MAX_RESPONSE_LENGTH = 600;
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

    const rawAngle =
        typeof body === "object" && body !== null && "angle" in body
            ? (body as { angle?: unknown }).angle
            : "";
    const angle = typeof rawAngle === "string" ? rawAngle.trim() : "";

    if (angle.length > MAX_ANGLE_LENGTH) {
        return NextResponse.json(
            { error: `Keep your angle under ${MAX_ANGLE_LENGTH} characters.` },
            { status: 400 }
        );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY is not configured.");
        return NextResponse.json({ error: "AI generation is not configured." }, { status: 500 });
    }

    const challenge = getTonightChallenge();
    const prompt = buildGenerationPrompt(challenge, angle);

    try {
        const ai = new GoogleGenAI({ apiKey });
        const generatedText = (await generateWithGemini(ai, prompt)).slice(
            0,
            MAX_RESPONSE_LENGTH
        );

        if (!generatedText) {
            throw new Error("Gemini returned an empty response.");
        }

        const { data: submission, error } = await supabase
            .from("captions")
            .insert({
                text: generatedText,
                prompt,
                user_id: user.id,
                challenge_date: challenge.date,
                challenge_text: challenge.text,
            })
            .select("id, text")
            .single();

        if (error) {
            console.error("Draft insert failed:", error.message);
            return NextResponse.json(
                { error: "The response was generated but could not be saved. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({ submission });
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
