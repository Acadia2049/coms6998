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
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
    }).format(new Date(`${challenge.date}T12:00:00-04:00`));

    return (
        <div className="notice-site">
            <div className="wall-grain" aria-hidden="true" />
            <SiteHeader isAuthenticated={Boolean(user)} currentPage="tonight" />

            <main>
                <section className="hero-shell" aria-labelledby="hero-title">
                    <div className="hero-copy">
                        <p className="hero-eyebrow">TONIGHT / {formattedDate.toUpperCase()}</p>
                        <h1 id="hero-title">The city has a new story. It needs one rule.</h1>
                        <p className="hero-intro">
                            Read the incident, write the rule that keeps New Yorkers safe,
                            then post it to tonight&apos;s wall.
                        </p>

                        <article className="scene-notice" aria-labelledby="scene-location">
                            <div className="scene-notice-topline">
                                <span>NYC MIDNIGHT INCIDENT FILE</span>
                                <span>CASE {challenge.date.replaceAll("-", "/")}</span>
                            </div>
                            <div className="scene-location-row">
                                <div>
                                    <span className="scene-label">TONIGHT&apos;S SCENE</span>
                                    <h2 id="scene-location">{challenge.location}</h2>
                                </div>
                                <time>{challenge.time}</time>
                            </div>
                            <p className="scene-incident">{challenge.incident}</p>
                            <div className="scene-prompt-block">
                                <span>YOUR ASSIGNMENT</span>
                                <p className="scene-question">{challenge.prompt}</p>
                            </div>
                            <div className="fiction-stamp">FICTIONAL / NOT CITY GUIDANCE</div>
                        </article>

                        <ol className="hero-flow" aria-label="How NYC After Dark works">
                            <li><span>01</span> Write</li>
                            <li><span>02</span> Draft</li>
                            <li><span>03</span> Publish</li>
                            <li><span>04</span> Become canon</li>
                        </ol>
                    </div>

                    <aside className="hero-action" aria-label="Create tonight's rule">
                        <div className="creator-context">
                            <span className="section-index">CREATE / PRIVATE UNTIL PUBLISHED</span>
                            <p>Your words become a paper notice, not a chat response.</p>
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
                            <span className="section-index">PUBLIC NOTICE BOARD / LIVE TONIGHT</span>
                            <h2 id="wall-title">Tonight&apos;s Wall</h2>
                            <p>Read the notices. Make the strongest rule canon before the NYC date changes.</p>
                        </div>
                        <div className="wall-count" aria-label={`${captions?.length ?? 0} rules posted`}>
                            <strong>{String(captions?.length ?? 0).padStart(2, "0")}</strong>
                            <span>RULES<br />POSTED</span>
                        </div>
                    </header>

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
                                    index={index}
                                    isTop={index === 0}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="how-section" id="how-it-works" aria-labelledby="how-title">
                    <header>
                        <span className="section-index">HOW THE WALL WORKS</span>
                        <h2 id="how-title">Write → Draft → Publish → Canon</h2>
                    </header>
                    <div className="how-grid">
                        <article>
                            <span>01</span>
                            <div>
                                <h3>Start human</h3>
                                <p>Give the night one clear rule idea in 10–180 characters.</p>
                            </div>
                        </article>
                        <article>
                            <span>02</span>
                            <div>
                                <h3>Shape it privately</h3>
                                <p>AI makes a saved 15–40 word draft. Edit or regenerate it in place.</p>
                            </div>
                        </article>
                        <article>
                            <span>03</span>
                            <div>
                                <h3>Post it publicly</h3>
                                <p>Votes decide which three notices survive in the seven-night archive.</p>
                            </div>
                        </article>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
