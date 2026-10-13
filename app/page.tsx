import CaptionCard from "@/app/components/CaptionCard";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
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
            <SiteHeader isAuthenticated={Boolean(user)} />

            <main>
                <section className="hero-shell" aria-labelledby="hero-title">
                    <div className="hero-copy">
                        <p className="hero-eyebrow">A NEW YORK STORY, WRITTEN NIGHTLY</p>
                        <h1 id="hero-title">After midnight, every place has rules.</h1>
                        <p className="hero-intro">
                            Write one rule. AI makes it unsettling. The city decides if it becomes canon.
                        </p>

                        <article className="scene-notice" aria-labelledby="scene-location">
                            <div className="scene-notice-topline">
                                <span>TONIGHT&apos;S WALL</span>
                                <span>{formattedDate.toUpperCase()}</span>
                            </div>
                            <div className="scene-location-row">
                                <div>
                                    <span className="scene-label">LOCATION</span>
                                    <h2 id="scene-location">{challenge.location}</h2>
                                </div>
                                <time>{challenge.time}</time>
                            </div>
                            <p className="scene-incident">{challenge.incident}</p>
                            <p className="scene-question">{challenge.prompt}</p>
                            <div className="fiction-stamp">FICTIONAL NIGHT NOTICE</div>
                        </article>

                        <ol className="hero-flow" aria-label="How NYC After Dark works">
                            <li><span>01</span> Write a rule</li>
                            <li><span>02</span> AI makes it unsettling</li>
                            <li><span>03</span> Publish</li>
                            <li><span>04</span> Vote</li>
                        </ol>
                    </div>

                    <aside className="hero-action" aria-label="Create tonight's rule">
                        {user ? (
                            <SubmissionComposer initialDraft={initialDraft} />
                        ) : (
                            <section className="signin-callout">
                                <span className="notice-kicker">ADD A RULE</span>
                                <h2>What must people do to survive tonight?</h2>
                                <p>
                                    Sign in to write a seed. AI will turn it into a private,
                                    editable night notice before anything is published.
                                </p>
                                <GoogleSignInButton />
                                <small>Browsing the wall does not require an account.</small>
                            </section>
                        )}
                    </aside>
                </section>

                <section className="tonight-wall" id="tonights-wall" aria-labelledby="wall-title">
                    <header className="section-heading">
                        <div>
                            <span className="section-index">02 / PUBLIC NOTICE BOARD</span>
                            <h2 id="wall-title">Tonight&apos;s Wall</h2>
                            <p>Voting stays open until the next NYC night begins.</p>
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
                        <span className="section-index">03 / HOW IT WORKS</span>
                        <h2 id="how-title">One human idea. One unsettling notice.</h2>
                    </header>
                    <div className="how-grid">
                        <article>
                            <span>01</span>
                            <h3>Write the seed</h3>
                            <p>Give the night one clear rule idea in 10–180 characters.</p>
                        </article>
                        <article>
                            <span>02</span>
                            <h3>Shape the notice</h3>
                            <p>AI shapes it into a fictional 15–40 word rule. You can edit it.</p>
                        </article>
                        <article>
                            <span>03</span>
                            <h3>Make it canon</h3>
                            <p>The three highest-ranked rules enter Past Nights. Number one becomes the primary rule.</p>
                        </article>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
