import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import CaptionCard from "./components/CaptionCard";
import CompleteProfileForm from "./components/CompleteProfileForm";
import GoogleSignInButton from "./components/GoogleSignInButton";
import SignOutButton from "./components/SignOutButton";

export default async function Home() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
        console.error("Authentication check failed:", authError.message);
    }

    if (!user) {
        return (
            <main className="page-container">
                <header className="page-header">
                    <h1>Funny Captions</h1>
                    <p>Sign in to view your saved Supabase content.</p>
                    <GoogleSignInButton />
                </header>
            </main>
        );
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        console.error("Profile fetch failed:", profileError.message);
    }

    const needsProfileCompletion =
        !profile?.first_name || !profile?.last_name;

    const { data: captions, error } = await supabase
        .from("captions")
        .select("id, text")
        .order("id");

    return (
        <main className="page-container">
            <header className="page-header">
                <h1>Funny Captions</h1>
                <p>Browse captions loaded directly from Supabase.</p>

                <div>
                    <p>Signed in as {user.email}</p>

                    <div className="auth-actions">
                        <Link className="profile-link-button" href="/profile">
                            Profile
                        </Link>

                        <Link className="profile-link-button" href="/dashboard">
                            Dashboard
                        </Link>

                        <SignOutButton />
                    </div>
                </div>

                {needsProfileCompletion && (
                    <CompleteProfileForm
                        userId={user.id}
                        initialFirstName={profile?.first_name}
                        initialLastName={profile?.last_name}
                    />
                )}
            </header>

            {error ? (
                <div className="message-box error-message">
                    <h2>Something went wrong</h2>
                    <p>{error.message}</p>
                </div>
            ) : !captions || captions.length === 0 ? (
                <div className="message-box">
                    <h2>No captions yet</h2>
                    <p>Check back later for new captions.</p>
                </div>
            ) : (
                <div className="caption-grid">
                    {captions.map((caption) => (
                        <CaptionCard
                            key={caption.id}
                            id={caption.id}
                            text={caption.text}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
