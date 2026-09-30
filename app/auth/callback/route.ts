import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(
            new URL("/?auth_error=missing_code", request.url)
        );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Auth callback failed:", error.message);

        return NextResponse.redirect(
            new URL("/?auth_error=callback_failed", request.url)
        );
    }

    return NextResponse.redirect(new URL("/", request.url));
}