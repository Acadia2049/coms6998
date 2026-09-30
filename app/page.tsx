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
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="login-page">
                <div className="login-glow login-glow-left" />
                <div className="login-glow login-glow-right" />

                <section className="login-card">
                    <div className="brand-mark" aria-hidden="true">
                        &ldquo;
                    </div>
                    <p className="eyebrow">Caption Vault</p>
                    <h1>Your funniest ideas, kept in one place.</h1>
                    <p className="login-description">
                        Sign in to open your private caption collection and
                        pick up exactly where you left off.
                    </p>
                    <GoogleSignInButton />
                    <p className="privacy-note">
                        <span className="privacy-dot" aria-hidden="true" />
                        Your saved content stays behind your account.
                    </p>
                </section>
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
        <main className="home-page">
            <nav className="home-nav" aria-label="Main navigation">
                <Link className="home-brand" href="/">
                    <span className="home-brand-mark" aria-hidden="true">
                        &ldquo;
                    </span>
                    <span>Caption Vault</span>
                </Link>

                <div className="auth-actions">
                    <span className="signed-in-email">{user.email}</span>
                    <Link className="profile-link-button" href="/profile">
                        Profile
                    </Link>
                    <Link className="profile-link-button" href="/dashboard">
                        Dashboard
                    </Link>
                    <SignOutButton />
                </div>
            </nav>

            <div className="home-content">
                <header className="collection-header">
                    <div>
                        <p className="eyebrow">Your private collection</p>
                        <h1>Captions worth keeping.</h1>
                        <p className="collection-description">
                            A small archive of ideas saved from Supabase,
                            available only after you sign in.
                        </p>
                    </div>

                    <div className="caption-count" aria-label={`${captions?.length ?? 0} saved captions`}>
                        <strong>{captions?.length ?? 0}</strong>
                        <span>saved captions</span>
                    </div>
                </header>

                {needsProfileCompletion && (
                    <CompleteProfileForm
                        userId={user.id}
                        initialFirstName={profile?.first_name}
                        initialLastName={profile?.last_name}
                    />
                )}

                {error ? (
                    <div className="message-box error-message">
                        <h2>Something went wrong</h2>
                        <p>{error.message}</p>
                    </div>
                ) : !captions || captions.length === 0 ? (
                    <div className="message-box empty-message">
                        <span aria-hidden="true">&ldquo;</span>
                        <h2>No captions yet</h2>
                        <p>Your saved captions will appear here.</p>
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
            </div>
        </main>
    );
}
