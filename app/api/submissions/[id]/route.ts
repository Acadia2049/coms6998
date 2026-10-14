import { NextResponse } from "next/server";

import { getTonightChallenge } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Sign in to delete a rule." }, { status: 401 });
    }

    const { id } = await context.params;
    const submissionId = Number(id);

    if (!Number.isSafeInteger(submissionId) || submissionId < 1) {
        return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const challenge = getTonightChallenge();
    const { data: submission, error } = await supabase
        .from("captions")
        .delete()
        .eq("id", submissionId)
        .eq("user_id", user.id)
        .eq("challenge_date", challenge.date)
        .eq("challenge_text", challenge.id)
        .not("published_at", "is", null)
        .select("id")
        .maybeSingle();

    if (error) {
        console.error("Published rule deletion failed:", error.message);
        return NextResponse.json({ error: "Could not delete this rule." }, { status: 500 });
    }

    if (!submission) {
        return NextResponse.json(
            { error: "Published rule not found or not owned by you." },
            { status: 404 }
        );
    }

    return NextResponse.json({ deletedId: submission.id });
}
