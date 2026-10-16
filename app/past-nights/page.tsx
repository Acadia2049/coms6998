import Image from "next/image";
import type { CSSProperties } from "react";

import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import { getRecentPastChallenges } from "@/lib/challenges";
import { getSceneVisual } from "@/lib/scene-visuals";
import { createClient } from "@/lib/supabase/server";
import { getUserFirstName } from "@/lib/user-name";

export const dynamic = "force-dynamic";

type ArchivedRule = {
    id: number;
    text: string;
    vote_score: number;
    published_at: string | null;
    challenge_date: string;
    challenge_text: string;
};

export default async function PastNightsPage() {
    const supabase = await createClient();
    const nights = getRecentPastChallenges(7);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from("captions")
        .select("id, text, vote_score, published_at, challenge_date, challenge_text")
        .in("challenge_date", nights.map((night) => night.date))
        .in("challenge_text", nights.map((night) => night.id))
        .not("published_at", "is", null)
        .order("challenge_date", { ascending: false })
        .order("vote_score", { ascending: false })
        .order("published_at", { ascending: true });

    const archivedRules = (data ?? []) as ArchivedRule[];
    return (
        <div className="notice-site living-wall-site archive-wall-site">
            <SiteHeader
                isAuthenticated={Boolean(user)}
                currentPage="archive"
                accountName={user ? getUserFirstName(user) : undefined}
            />

            <main className="archive-wall-main">
                <header className="archive-wall-hero">
                    <div className="archive-title-poster">
                        <span className="archive-eyebrow">Previous 07 nights</span>
                        <h1>Past <em>Nights</em></h1>
                        <p>
                            The last seven scenes, with the warnings people voted to keep.
                        </p>
                    </div>
                </header>

                {error ? (
                    <div className="wall-state wall-error">
                        The archive could not be opened. Try refreshing.
                    </div>
                ) : (
                    <div className="archive-wall-grid">
                        {nights.map((night, nightIndex) => {
                            const visual = getSceneVisual(night.id);
                            const rules = archivedRules
                                .filter(
                                    (rule) =>
                                        rule.challenge_date === night.date &&
                                        rule.challenge_text === night.id
                                )
                                .sort((first, second) => {
                                    if (second.vote_score !== first.vote_score) {
                                        return second.vote_score - first.vote_score;
                                    }

                                    return (first.published_at ?? "").localeCompare(
                                        second.published_at ?? ""
                                    );
                                })
                                .slice(0, 3);
                            const dateLabel = new Intl.DateTimeFormat("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                timeZone: "America/New_York",
                            }).format(new Date(`${night.date}T12:00:00-04:00`));

                            return (
                                <article
                                    className={`archive-wall-card archive-wall-card-${(nightIndex % 3) + 1}`}
                                    key={night.date}
                                >
                                    <div className="archive-card-strip">
                                        <span>FILE {String(nightIndex + 1).padStart(2, "0")}</span>
                                        <time dateTime={night.date}>{dateLabel}</time>
                                        <span>{night.time}</span>
                                    </div>

                                    <div className="archive-card-body">
                                        <figure className="archive-card-photo">
                                            <div className="archive-card-photo-frame">
                                                <Image
                                                    src={visual.image}
                                                    alt={visual.imageAlt}
                                                    fill
                                                    sizes="(max-width: 760px) 88vw, 36vw"
                                                    style={{
                                                        objectFit: "cover",
                                                        objectPosition: visual.imagePosition,
                                                        "--mobile-object-position": visual.mobileImagePosition,
                                                    } as CSSProperties}
                                                />
                                            </div>
                                            <figcaption>{visual.routeLabel}</figcaption>
                                        </figure>

                                        <div className="archive-card-copy">
                                            <span className="archive-card-status">
                                                {String(rules.length).padStart(2, "0")} notices survived
                                            </span>
                                            <h2>{night.location}</h2>
                                            <p>{night.incident}</p>
                                        </div>
                                    </div>

                                    {rules.length ? (
                                        <ol className="archive-notice-list">
                                            {rules.map((rule, index) => (
                                                <li key={rule.id}>
                                                    <span>{index === 0 ? "TOP" : `0${index + 1}`}</span>
                                                    <p>{rule.text}</p>
                                                    <small>{rule.vote_score} {rule.vote_score === 1 ? "vote" : "votes"}</small>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <div className="archive-no-notices">
                                            <span>No public warning survived this night.</span>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}
