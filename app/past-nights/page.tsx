import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import { getRecentPastChallenges } from "@/lib/challenges";
import { createClient } from "@/lib/supabase/server";

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
        <div className="notice-site archive-site">
            <div className="wall-grain" aria-hidden="true" />
            <SiteHeader isAuthenticated={Boolean(user)} />

            <main className="archive-main">
                <header className="archive-hero">
                    <span className="section-index">THE OFFICIAL RECORD / LAST 7 NIGHTS</span>
                    <h1>Past Nights</h1>
                    <p>
                        Voting is closed. Each night&apos;s top three notices are preserved as canon;
                        the highest-ranked entry becomes the primary rule.
                    </p>
                </header>

                {error ? (
                    <div className="wall-state wall-error">
                        The archive could not be opened. Try refreshing.
                    </div>
                ) : (
                    <div className="archive-list">
                        {nights.map((night) => {
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
                                month: "short",
                                day: "numeric",
                                timeZone: "America/New_York",
                            }).format(new Date(`${night.date}T12:00:00Z`));

                            return (
                                <section className="archive-night" key={night.date}>
                                    <header className="archive-night-heading">
                                        <div>
                                            <span>{dateLabel.toUpperCase()} · {night.time}</span>
                                            <h2>{night.location}</h2>
                                        </div>
                                        <strong>
                                            {rules.length} {rules.length === 1 ? "RULE" : "RULES"} BECAME CANON
                                        </strong>
                                    </header>

                                    {rules.length ? (
                                        <ol className="canon-list">
                                            {rules.map((rule, index) => (
                                                <li className={index === 0 ? "primary-canon" : ""} key={rule.id}>
                                                    <div className="canon-rank">
                                                        <span>#{index + 1}</span>
                                                        <small>{index === 0 ? "NIGHT'S PRIMARY RULE" : "CANON"}</small>
                                                    </div>
                                                    <p>{rule.text}</p>
                                                    <span className="canon-votes">{rule.vote_score} CANON VOTES</span>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <div className="archive-empty-night">
                                            No rules from this night entered the new archive.
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}
