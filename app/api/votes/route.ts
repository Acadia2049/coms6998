import { NextResponse } from "next/server";

import { getTonightChallenge } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const rawCaptionId =
        typeof body === "object" && body !== null && "captionId" in body
            ? (body as { captionId?: unknown }).captionId
            : null;
    const captionId = Number(rawCaptionId);

    if (!Number.isSafeInteger(captionId) || captionId < 1) {
        return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const challenge = getTonightChallenge();
    const { data: currentCaption, error: captionError } = await supabase
        .from("captions")
        .select("id")
        .eq("id", captionId)
        .eq("challenge_date", challenge.date)
        .eq("challenge_text", challenge.id)
        .not("published_at", "is", null)
        .maybeSingle();

    if (captionError) {
        console.error("Vote target lookup failed:", captionError.message);
        return NextResponse.json({ error: "Could not verify this rule." }, { status: 500 });
    }

    if (!currentCaption) {
        return NextResponse.json(
            { error: "Canon voting is only open for tonight's wall." },
            { status: 409 }
        );
    }

    const { error } = await supabase.from("votes").insert({
        caption_id: captionId,
        user_id: user.id,
    });

    if (error?.code === "23505") {
        return NextResponse.json({ error: "You already voted for this response." }, { status: 409 });
    }

    if (error) {
        console.error("Vote failed:", error.message);
        return NextResponse.json({ error: "Could not save your vote." }, { status: 500 });
    }

    const { data: caption } = await supabase
        .from("captions")
        .select("vote_score")
        .eq("id", captionId)
        .single();

    return NextResponse.json({ voteScore: caption?.vote_score ?? null });
}
