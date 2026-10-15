import CaptionCard from "@/app/components/CaptionCard";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
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
        .order("published_at", { ascending: true });

    let initialDraft: Draft | null = null;
    const votedCaptionIds = new Set<number>();
    const ownedCaptionIds = new Set<number>();

    if (user) {
        const [{ data: draft }, { data: votes }, { data: ownedCaptions }] = await Promise.all([
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
            supabase
                .from("captions")
                .select("id")
                .eq("user_id", user.id)
                .eq("challenge_date", challenge.date)
                .eq("challenge_text", challenge.id)
                .not("published_at", "is", null),
        ]);

        initialDraft = draft
            ? {
                id: draft.id,
                text: draft.text,
                seed: extractSeedFromGenerationPrompt(draft.prompt ?? ""),
            }
            : null;
        votes?.forEach((vote) => votedCaptionIds.add(vote.caption_id));
        ownedCaptions?.forEach((caption) => ownedCaptionIds.add(caption.id));
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
    }).format(new Date(`${challenge.date}T12:00:00-04:00`));

    return (
        <div className="notice-site">
            <SiteHeader isAuthenticated={Boolean(user)} currentPage="tonight" />

            <main>
                <section className="hero-shell" aria-labelledby="hero-title">
                    <div className="hero-copy">
                        <div className="hero-status-line">
                            <p className="hero-eyebrow">NIGHT SERVICE / {formattedDate.toUpperCase()}</p>
                            <span><i aria-hidden="true" /> LIVE RECORD</span>
                        </div>
                        <h1 id="hero-title">There are rules for getting home.</h1>
                        <p className="hero-intro">
                            One impossible incident is recorded every night. New Yorkers write
                            the guidance the city forgot to issue.
                        </p>

                        <article className="scene-notice" aria-labelledby="scene-location">
                            <div className="scene-notice-topline">
                                <span>ACTIVE INCIDENT BULLETIN</span>
                                <span>FILE {challenge.date.replaceAll("-", ".")}</span>
                            </div>
                            <div className="scene-location-row">
                                <div>
                                    <span className="scene-label">LOCATION / NIGHT ACCESS</span>
                                    <h2 id="scene-location">{challenge.location}</h2>
                                </div>
                                <time>{challenge.time}</time>
                            </div>
                            <p className="scene-incident">{challenge.incident}</p>
                            <div className="scene-prompt-block">
                                <span>PUBLIC GUIDANCE REQUESTED</span>
                                <p className="scene-question">{challenge.prompt}</p>
                            </div>
                            <dl className="incident-meta">
                                <div><dt>STATUS</dt><dd>UNRESOLVED</dd></div>
                                <div><dt>VALID UNTIL</dt><dd>SUNRISE</dd></div>
                                <div><dt>JURISDICTION</dt><dd>FIVE BOROUGHS</dd></div>
                            </dl>
                        </article>
                    </div>

                    <aside className="hero-action" aria-label="Create tonight's rule">
                        <div className="creator-context">
                            <span className="section-index">SUBMIT GUIDANCE / DESK 01</span>
                            <p>Draft privately. Publish only when the instruction is precise.</p>
                        </div>
                        <SubmissionComposer
                            initialDraft={initialDraft}
                            isAuthenticated={Boolean(user)}
                        />
                    </aside>
                </section>

                <section className="tonight-wall" id="tonights-wall" aria-labelledby="wall-title">
                    <header className="section-heading">
                        <div>
                            <span className="section-index">COMMUNITY RECORD / RANKED IN REAL TIME</span>
                            <h2 id="wall-title">Active guidance</h2>
                            <p>One vote confirms a notice. Vote again to withdraw your confirmation.</p>
                        </div>
                        <div className="wall-count" aria-label={`${captions?.length ?? 0} rules posted`}>
                            <strong>{String(captions?.length ?? 0).padStart(2, "0")}</strong>
                            <span>ACTIVE<br />NOTICES</span>
                        </div>
                    </header>

                    <div className="wall-legend" aria-label="Notice status key">
                        <span><i className="legend-active" aria-hidden="true" /> Active tonight</span>
                        <span><i className="legend-leading" aria-hidden="true" /> Current primary</span>
                        <span>Archive closes at NYC midnight</span>
                    </div>

                    {captionsError ? (
                        <div className="wall-state wall-error">
                            The wall is temporarily covered. Try refreshing.
                        </div>
                    ) : !captions?.length ? (
                        <div className="wall-state wall-empty">
                            <span className="empty-symbol" aria-hidden="true">!</span>
                            <div>
                                <h3>No notices have been posted.</h3>
                                <p>Tonight&apos;s first rule could become the first entry in the archive.</p>
                            </div>
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
                </section>

                <section className="how-section" id="how-it-works" aria-labelledby="how-title">
                    <header>
                        <span className="section-index">ARCHIVE PROTOCOL / 03 STEPS</span>
                        <h2 id="how-title">How a rule enters the record</h2>
                    </header>
                    <div className="how-grid">
                        <article>
                            <span>01</span>
                            <div>
                                <h3>Report a rule</h3>
                                <p>Describe one action, warning, or ritual in 10–180 characters.</p>
                            </div>
                        </article>
                        <article>
                            <span>02</span>
                            <div>
                                <h3>Review the language</h3>
                                <p>An AI-assisted editor shapes a private draft. You approve every word.</p>
                            </div>
                        </article>
                        <article>
                            <span>03</span>
                            <div>
                                <h3>Enter the archive</h3>
                                <p>Community confirmations decide which three notices survive the night.</p>
                            </div>
                        </article>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
