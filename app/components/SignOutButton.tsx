"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
    const router = useRouter();

    async function handleSignOut() {
        const supabase = createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Sign out failed:", error.message);
            return;
        }

        router.refresh();
    }

    return (
        <button
            type="button"
            className="google-sign-in-button"
            onClick={handleSignOut}
        >
            Sign out
        </button>
    );
}