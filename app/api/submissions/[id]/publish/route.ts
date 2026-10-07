import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const MAX_RESPONSE_LENGTH = 600;

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Sign in to publish a response." }, { status: 401 });
    }

    const { id } = await context.params;
    const submissionId = Number(id);

    if (!Number.isSafeInteger(submissionId) || submissionId < 1) {
        return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const rawText =
        typeof body === "object" && body !== null && "text" in body
            ? (body as { text?: unknown }).text
            : "";
    const text = typeof rawText === "string" ? rawText.trim() : "";

    if (!text || text.length > MAX_RESPONSE_LENGTH) {
        return NextResponse.json(
            { error: `Response must be between 1 and ${MAX_RESPONSE_LENGTH} characters.` },
            { status: 400 }
        );
    }

    const { data: submission, error } = await supabase
        .from("captions")
        .update({
            text,
            published_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .eq("user_id", user.id)
        .is("published_at", null)
        .select("id, text, published_at")
        .maybeSingle();

    if (error) {
        console.error("Publish failed:", error.message);
        return NextResponse.json({ error: "Could not publish this response." }, { status: 500 });
    }

    if (!submission) {
        return NextResponse.json(
            { error: "Draft not found, already published, or not owned by you." },
            { status: 404 }
        );
    }

    return NextResponse.json({ submission });
}
