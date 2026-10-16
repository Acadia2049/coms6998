import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import { getRecentPastChallenges } from "@/lib/challenges";
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
        <div className="notice-site archive-site">
            <SiteHeader
                isAuthenticated={Boolean(user)}
                currentPage="archive"
                accountName={user ? getUserFirstName(user) : undefined}
            />

            <main className="archive-main">
                <header className="archive-hero">
                    <span className="section-index">CLOSED RECORDS / PREVIOUS 07 NIGHTS</span>
                    <h1>Night archive</h1>
                    <p>
                        Each file closes at midnight. The three most confirmed notices remain;
                        the highest-ranked instruction is marked primary.
                    </p>
                </header>

                <div className="archive-key" aria-label="Archive status">
                    <span>RECORD WINDOW</span>
                    <strong>07 NIGHTS</strong>
                    <span>EDITING</span>
                    <strong>CLOSED</strong>
                    <span>ORDER</span>
                    <strong>NEWEST FIRST</strong>
                </div>

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
                                            {String(rules.length).padStart(2, "0")} PRESERVED
                                        </strong>
                                    </header>

                                    {rules.length ? (
                                        <ol className="canon-list">
                                            {rules.map((rule, index) => (
                                                <li className={index === 0 ? "primary-canon" : ""} key={rule.id}>
                                                    <div className="canon-rank">
                                                        <span>#{index + 1}</span>
                                                        <small>{index === 0 ? "PRIMARY GUIDANCE" : "PRESERVED NOTICE"}</small>
                                                    </div>
                                                    <p>{rule.text}</p>
                                                    <span className="canon-votes">{rule.vote_score} CONFIRMATIONS</span>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <div className="archive-empty-night">
                                            RECORD INCOMPLETE / NO GUIDANCE WAS PRESERVED
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
