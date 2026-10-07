import Link from "next/link";

import CaptionCard from "@/app/components/CaptionCard";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import SignOutButton from "@/app/components/SignOutButton";
import SubmissionComposer from "@/app/components/SubmissionComposer";
import { getTonightChallenge } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Draft = {
    id: number;
    text: string;
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
        .not("published_at", "is", null)
        .order("vote_score", { ascending: false })
        .order("published_at", { ascending: false });

    let initialDraft: Draft | null = null;
    const votedCaptionIds = new Set<number>();

    if (user) {
        const [{ data: draft }, { data: votes }] = await Promise.all([
            supabase
                .from("captions")
                .select("id, text")
                .eq("user_id", user.id)
                .eq("challenge_date", challenge.date)
                .is("published_at", null)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase.from("votes").select("caption_id").eq("user_id", user.id),
        ]);

        initialDraft = draft;
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
                    <span>01 / TONIGHT&apos;S CHALLENGE</span>
                    <span>{formattedDate} · NEW YORK CITY</span>
                </div>
                <div className="challenge-stage">
                    <div className="challenge-poster">
                        <span className="challenge-kicker">A new NYC challenge every night.</span>
                        <h1>{challenge.text}</h1>
                        {challenge.description && (
                            <p className="challenge-description">{challenge.description}</p>
                        )}
                        <div className="challenge-poster-footer" aria-hidden="true">
                            <span>TONIGHT ONLY</span>
                            <span>NO PERFECT ANSWERS</span>
                        </div>
                    </div>
                </div>
            </section>

            <nav className="challenge-flow" aria-label="How it works">
                <ol>
                    <li><span>01</span> Take the challenge</li>
                    <li><span>02</span> Make your drop</li>
                    <li><span>03</span> Stamp your favorites</li>
                </ol>
            </nav>

            <div className="night-content">
                {user ? (
                    <SubmissionComposer initialDraft={initialDraft} />
                ) : (
                    <section className="signin-callout">
                        <span className="step-stamp">02 / MAKE YOUR DROP</span>
                        <div>
                            <h2>Got a response?</h2>
                            <p>Sign in to generate your nightly drop, edit it, and paste it on the wall.</p>
                        </div>
                        <GoogleSignInButton />
                    </section>
                )}

                <section className="wall-section" aria-labelledby="wall-title">
                    <header className="wall-heading">
                        <div>
                            <span className="step-stamp">03 / THE WALL</span>
                            <h2 id="wall-title">Tonight&apos;s drops</h2>
                        </div>
                        <div className="wall-count">
                            <strong>{captions?.length ?? 0}</strong>
                            <span>responses pasted up</span>
                        </div>
                    </header>

                    {captionsError ? (
                        <div className="night-message error-message">
                            The wall is temporarily covered. Try refreshing.
                        </div>
                    ) : !captions?.length ? (
                        <div className="empty-wall">
                            <span aria-hidden="true">✦</span>
                            <h3>The wall is fresh.</h3>
                            <p>Be the first person to leave something worth coming back for.</p>
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
                <span>Built after midnight near the 1 train.</span>
                <span>A new challenge lands tomorrow.</span>
            </footer>
        </main>
    );
}
