import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import CaptionCard from "@/app/components/CaptionCard";
import EvidenceNote from "@/app/components/EvidenceNote";
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
        <div className="notice-site home-site found-archive">
            <SiteHeader isAuthenticated={Boolean(user)} currentPage="tonight" />

            <main className="found-archive-main">
                <section className="archive-dossier" aria-labelledby="incident-title">
                    <span className="dossier-tab">OPEN CASE · {challenge.date.replaceAll("-", ".")}</span>

                    <header className="dossier-header">
                        <div>
                            <span>NYC AFTER DARK / COMMUNITY INCIDENT FILE</span>
                            <strong>RECORD {challenge.id.toUpperCase()}</strong>
                        </div>
                        <dl>
                            <div>
                                <dt>Status</dt>
                                <dd className="tampered-status">
                                    <span aria-hidden="true">Closed</span>
                                    <strong>Unresolved</strong>
                                </dd>
                            </div>
                            <div><dt>Received</dt><dd>{challenge.time}</dd></div>
                        </dl>
                    </header>

                    <div className="dossier-body">
                        <div className="dossier-copy">
                            <p className="dossier-date">{formattedDate}</p>
                            <p className="dossier-section-label">Incident report</p>
                            <h1
                                className={isLongTitle ? "dossier-title dossier-title-long" : "dossier-title"}
                                id="incident-title"
                            >
                                {challenge.location}
                            </h1>
                            <blockquote>{challenge.incident}</blockquote>
                            <p className="dossier-handnote" aria-label="Archivist note">
                                {visual.marginNote}
                            </p>

                            <div className="dossier-actions" aria-label="Tonight's incident actions">
                                <Link className="dossier-action-primary" href="#tonights-wall">
                                    Read Warnings
                                </Link>
                                <Link className="dossier-action-secondary" href="/write">
                                    Write a Rule
                                </Link>
                            </div>
                        </div>

                        <figure className="dossier-photo">
                            <div className="dossier-photo-frame">
                                <Image
                                    className="incident-photo"
                                    src={visual.image}
                                    alt={visual.imageAlt}
                                    fill
                                    priority
                                    sizes="(max-width: 760px) 92vw, 39vw"
                                    style={{
                                        objectPosition: visual.imagePosition,
                                        "--mobile-object-position": visual.mobileImagePosition,
                                    } as CSSProperties}
                                />
                            </div>
                            <figcaption>
                                <span>FIELD IMAGE / {visual.routeLabel}</span>
                                <span>FILED {challenge.time}</span>
                            </figcaption>
                            <EvidenceNote
                                detail={visual.folioDetail}
                                hiddenNote={visual.hiddenNote}
                                title={visual.folioTitle}
                                variant={visual.folioVariant}
                            />
                        </figure>
                    </div>

                    <footer className="dossier-footer">
                        <span>PUBLIC COPY · ANONYMOUSLY MAINTAINED</span>
                        <span>REPORT REMAINS OPEN UNTIL NYC MIDNIGHT</span>
                    </footer>
                </section>

                <section className="tonight-wall archive-addenda" id="tonights-wall" aria-labelledby="wall-title">
                    <ScrollReveal>
                        <header className="addenda-heading">
                            <div>
                                <span>Warnings left by anonymous New Yorkers</span>
                                <h2 id="wall-title">Tonight&apos;s Wall</h2>
                                <p>Warnings added to tonight&apos;s open incident file.</p>
                            </div>
                            <p className="addenda-count" aria-label={`${warningCount} warnings posted`}>
                                <strong>{String(warningCount).padStart(2, "0")}</strong>
                                <span>Warnings posted</span>
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
            </main>

            <SiteFooter />
        </div>
    );
}
