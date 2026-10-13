import Link from "next/link";

import CaptionCard from "@/app/components/CaptionCard";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import SignOutButton from "@/app/components/SignOutButton";
import SubmissionComposer from "@/app/components/SubmissionComposer";
import { extractSeedFromGenerationPrompt, getTonightChallenge } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Draft = {
    id: number;
    text: string;
    seed: string;
};

export default async function Home() {
    const supabase = await createClient();
    const challenge = getTonightChallenge();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: captions, error: captionsError } = await supabase
        .from("captions")
        .select("id, text, vote_score, published_at")
        .eq("challenge_date", challenge.date)
        .eq("challenge_text", challenge.id)
        .not("published_at", "is", null)
        .order("vote_score", { ascending: false })
        .order("published_at", { ascending: false });

    let initialDraft: Draft | null = null;
    const votedCaptionIds = new Set<number>();

    if (user) {
        const [{ data: draft }, { data: votes }] = await Promise.all([
            supabase
                .from("captions")
                .select("id, text, prompt")
                .eq("user_id", user.id)
                .eq("challenge_date", challenge.date)
                .eq("challenge_text", challenge.id)
                .is("published_at", null)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase.from("votes").select("caption_id").eq("user_id", user.id),
        ]);

        initialDraft = draft
            ? {
                id: draft.id,
                text: draft.text,
                seed: extractSeedFromGenerationPrompt(draft.prompt ?? ""),
            }
            : null;
        votes?.forEach((vote) => votedCaptionIds.add(vote.caption_id));
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
    }).format(new Date(`${challenge.date}T12:00:00-04:00`));

    return (
        <main className="night-page">
            <div className="print-noise" aria-hidden="true" />

            <nav className="night-nav" aria-label="Main navigation">
                <Link className="night-brand" href="/">
                    <span className="brand-city">NYC</span>
                    <span>AFTER DARK</span>
                </Link>

                <div className="night-auth-actions">
                    {user ? (
                        <>
                            <span className="night-email">{user.email}</span>
                            <Link className="night-text-link" href="/profile">
                                Profile
                            </Link>
                            <SignOutButton />
                        </>
                    ) : (
                        <GoogleSignInButton />
                    )}
                </div>
            </nav>

            <section className="challenge-section">
                <div className="challenge-meta">
                    <span>01 / TONIGHT&apos;S LOCATION</span>
                    <span>{formattedDate} · NEW YORK CITY</span>
                </div>
                <div className="challenge-stage">
                    <div className="challenge-poster">
                        <span className="challenge-kicker">
                            {challenge.location} · {challenge.time}
                        </span>
                        <h1>{challenge.incident}</h1>
                        <p className="challenge-description">{challenge.prompt}</p>
                        <div className="challenge-poster-footer" aria-hidden="true">
                            <span>FICTIONAL NOTICE</span>
                            <span>TONIGHT ONLY</span>
                        </div>
                    </div>
                </div>
            </section>

            <nav className="challenge-flow" aria-label="How it works">
                <ol>
                    <li><span>01</span> Write one rule</li>
                    <li><span>02</span> AI makes it unsettling</li>
                    <li><span>03</span> Publish</li>
                    <li><span>04</span> Vote</li>
                </ol>
            </nav>

            <div className="night-content">
                {user ? (
                    <SubmissionComposer initialDraft={initialDraft} />
                ) : (
                    <section className="signin-callout">
                        <span className="step-stamp">02 / ADD A RULE</span>
                        <div>
                            <h2>Write one rule.</h2>
                            <p>Sign in, give the AI one rule idea, edit the saved draft, and post it to tonight&apos;s wall.</p>
                        </div>
                        <GoogleSignInButton />
                    </section>
                )}

                <section className="wall-section" aria-labelledby="wall-title">
                    <header className="wall-heading">
                        <div>
                            <span className="step-stamp">03 / TONIGHT&apos;S WALL</span>
                            <h2 id="wall-title">Tonight&apos;s rules</h2>
                        </div>
                        <div className="wall-count">
                            <strong>{captions?.length ?? 0}</strong>
                            <span>rules posted</span>
                        </div>
                    </header>

                    {captionsError ? (
                        <div className="night-message error-message">
                            The wall is temporarily covered. Try refreshing.
                        </div>
                    ) : !captions?.length ? (
                        <div className="empty-wall">
                            <span aria-hidden="true">✦</span>
                            <h3>No notices have been posted.</h3>
                            <p>Be the first person to write tonight&apos;s survival rule.</p>
                        </div>
                    ) : (
                        <div className="poster-wall">
                            {captions.map((caption, index) => (
                                <CaptionCard
                                    key={caption.id}
                                    id={caption.id}
                                    text={caption.text}
                                    voteScore={caption.vote_score}
                                    hasVoted={votedCaptionIds.has(caption.id)}
                                    canVote={Boolean(user)}
                                    index={index}
                                    isTop={index === 0}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <footer className="night-footer">
                <span>Fictional notices · AI generated from human seeds.</span>
                <span>A new location appears tomorrow.</span>
            </footer>
        </main>
    );
}
