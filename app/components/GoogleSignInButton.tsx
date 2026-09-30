"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
    async function handleSignIn() {
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Google sign-in failed:", error.message);
        }
    }

    return (
        <button
            type="button"
            className="google-sign-in-button"
            onClick={handleSignIn}
        >
            Sign in with Google
        </button>
    );
}