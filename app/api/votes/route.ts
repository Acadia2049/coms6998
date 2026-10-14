import { NextResponse } from "next/server";

import { getTonightChallenge } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

async function readCaptionId(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return null;
    }

    const rawCaptionId =
        typeof body === "object" && body !== null && "captionId" in body
            ? (body as { captionId?: unknown }).captionId
            : null;
    const captionId = Number(rawCaptionId);

    return Number.isSafeInteger(captionId) && captionId > 0 ? captionId : null;
}

async function isTonightCaption(captionId: number) {
    const supabase = await createClient();
    const challenge = getTonightChallenge();
    const { data, error } = await supabase
        .from("captions")
        .select("id")
        .eq("id", captionId)
        .eq("challenge_date", challenge.date)
        .eq("challenge_text", challenge.id)
        .not("published_at", "is", null)
        .maybeSingle();

    return { exists: Boolean(data), error };
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
    }

    const captionId = await readCaptionId(request);

    if (!captionId) {
        return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const { exists, error: captionError } = await isTonightCaption(captionId);

    if (captionError) {
        console.error("Vote target lookup failed:", captionError.message);
        return NextResponse.json({ error: "Could not verify this rule." }, { status: 500 });
    }

    if (!exists) {
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

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Sign in to remove your vote." }, { status: 401 });
    }

    const captionId = await readCaptionId(request);

    if (!captionId) {
        return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const { exists, error: captionError } = await isTonightCaption(captionId);

    if (captionError) {
        console.error("Vote target lookup failed:", captionError.message);
        return NextResponse.json({ error: "Could not verify this rule." }, { status: 500 });
    }

    if (!exists) {
        return NextResponse.json(
            { error: "Canon voting is only open for tonight's wall." },
            { status: 409 }
        );
    }

    const { data: removedVote, error } = await supabase
        .from("votes")
        .delete()
        .eq("caption_id", captionId)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

    if (error) {
        console.error("Vote removal failed:", error.message);
        return NextResponse.json({ error: "Could not remove your vote." }, { status: 500 });
    }

    if (!removedVote) {
        return NextResponse.json({ error: "You have not voted for this rule." }, { status: 404 });
    }

    const { data: caption } = await supabase
        .from("captions")
        .select("vote_score")
        .eq("id", captionId)
        .single();

    return NextResponse.json({ voteScore: caption?.vote_score ?? null });
}
