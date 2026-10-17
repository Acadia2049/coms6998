import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import CaptionCard from "@/app/components/CaptionCard";
import EvidenceNote from "@/app/components/EvidenceNote";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import ScrollReveal from "@/app/components/ScrollReveal";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import {
    getNightSceneById,
    getTonightChallenge,
    type DailyChallenge,
} from "@/lib/challenges";
import { getSceneVisual } from "@/lib/scene-visuals";
import { createClient } from "@/lib/supabase/server";
import { getUserFirstName } from "@/lib/user-name";

export const dynamic = "force-dynamic";

type HomePageProps = {
    searchParams: Promise<{ scene?: string | string[] }>;
};

function getDevelopmentPreview(
    challenge: DailyChallenge,
    requestedSceneId: string | string[] | undefined
) {
    if (process.env.NODE_ENV !== "development" || typeof requestedSceneId !== "string") {
        return challenge;
    }

    const scene = getNightSceneById(requestedSceneId);

    if (!scene) {
        return challenge;
    }

    return {
        ...scene,
        date: challenge.date,
        text: `${scene.incident} ${scene.prompt}`,
        description: `${scene.location} · ${scene.time}`,
    } satisfies DailyChallenge;
}

export default async function Home({ searchParams }: HomePageProps) {
    const supabase = await createClient();
    const baseChallenge = getTonightChallenge();
    const challenge = getDevelopmentPreview(baseChallenge, (await searchParams).scene);
    const visual = getSceneVisual(challenge.id);
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
        .order("published_at", { ascending: true });

    const votedCaptionIds = new Set<number>();
    const ownedCaptionIds = new Set<number>();

    if (user) {
        const [{ data: votes }, { data: ownedCaptions }] = await Promise.all([
            supabase.from("votes").select("caption_id").eq("user_id", user.id),
            supabase
                .from("captions")
                .select("id")
                .eq("user_id", user.id)
                .eq("challenge_date", challenge.date)
                .eq("challenge_text", challenge.id)
                .not("published_at", "is", null),
        ]);

        votes?.forEach((vote) => votedCaptionIds.add(vote.caption_id));
        ownedCaptions?.forEach((caption) => ownedCaptionIds.add(caption.id));
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
    }).format(new Date(`${challenge.date}T12:00:00-04:00`));
    const isLongTitle = challenge.location.length > 29;
    const warningCount = captions?.length ?? 0;

    return (
        <div className="notice-site home-site living-wall-site">
            <SiteHeader
                isAuthenticated={Boolean(user)}
                currentPage="tonight"
                accountName={user ? getUserFirstName(user) : undefined}
            />

            <main className="living-wall-main">
                <div className="living-wall">
                    <section className="wall-incident" aria-labelledby="incident-title">
                        <article className="incident-poster">
                            <div className="poster-brow">
                                <span>Tonight</span>
                                <time dateTime={challenge.date}>{formattedDate}</time>
                            </div>
                            <h1
                                className={isLongTitle ? "poster-title poster-title-long" : "poster-title"}
                                id="incident-title"
                            >
                                {challenge.location}
                            </h1>
                            <blockquote>{challenge.incident}</blockquote>
                            <p className="poster-handnote" aria-label="Anonymous note">
                                {visual.marginNote}
                            </p>
                            <div className="poster-actions" aria-label="Tonight's incident actions">
                                <Link href="#tonights-wall">Read warnings</Link>
                                <Link href="/write">Write a rule</Link>
                            </div>
                            <span className="poster-tear poster-tear-one" aria-hidden="true" />
                            <span className="poster-tear poster-tear-two" aria-hidden="true" />
                        </article>

                        <figure className="wall-photo">
                            <div
                                className="wall-photo-frame"
                                style={{ position: "relative", aspectRatio: "4 / 3" }}
                            >
                                <Image
                                    className="incident-photo"
                                    src={visual.image}
                                    alt={visual.imageAlt}
                                    fill
                                    priority
                                    sizes="(max-width: 760px) 92vw, 42vw"
                                    style={{
                                        objectPosition: visual.imagePosition,
                                        "--mobile-object-position": visual.mobileImagePosition,
                                    } as CSSProperties}
                                />
                            </div>
                            <figcaption>
                                <span>{visual.routeLabel}</span>
                                <span>{challenge.time}</span>
                            </figcaption>
                            <EvidenceNote
                                detail={visual.folioDetail}
                                hiddenNote={visual.hiddenNote}
                                title={visual.folioTitle}
                                variant={visual.folioVariant}
                            />
                        </figure>
                    </section>

                    {!user && (
                        <aside className="wall-sign-in-note" aria-label="Sign in to take part">
                            <div>
                                <span>Join tonight&apos;s wall</span>
                                <p>Sign in to post a warning or vote.</p>
                            </div>
                            <GoogleSignInButton />
                        </aside>
                    )}

                    <section className="tonight-wall wall-community" id="tonights-wall" aria-labelledby="wall-title">
                    <ScrollReveal>
                        <header className="wall-heading">
                            <h2 id="wall-title">Tonight&apos;s <span>Wall</span></h2>
                            <p className="wall-warning-count" aria-label={`${warningCount} warnings posted`}>
                                <strong>{String(warningCount).padStart(2, "0")}</strong>
                                <span>{warningCount === 1 ? "warning" : "warnings"}</span>
                            </p>
                        </header>

                        {captionsError ? (
                            <div className="wall-state wall-error">
                                The wall is temporarily covered. Try refreshing.
                            </div>
                        ) : !captions?.length ? (
                            <div className="addenda-empty">
                                <p>No warnings have been posted.</p>
                                <Link href="/write">Be the first to write a rule</Link>
                            </div>
                        ) : (
                            <div className="rule-grid">
                                {captions.map((caption, index) => (
                                    <CaptionCard
                                        key={caption.id}
                                        id={caption.id}
                                        text={caption.text}
                                        voteScore={caption.vote_score}
                                        hasVoted={votedCaptionIds.has(caption.id)}
                                        canVote={Boolean(user)}
                                        canDelete={ownedCaptionIds.has(caption.id)}
                                        index={index}
                                        isTop={index === 0}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollReveal>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
