import Image from "next/image";
import Link from "next/link";

import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import SubmissionComposer from "@/app/components/SubmissionComposer";
import { extractSeedFromGenerationPrompt, getTonightChallenge } from "@/lib/challenges";
import { getSceneVisual } from "@/lib/scene-visuals";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Draft = {
    id: number;
    text: string;
    seed: string;
};

export default async function WritePage() {
    const supabase = await createClient();
    const challenge = getTonightChallenge();
    const visual = getSceneVisual(challenge.id);
    const {
        data: { user },
    } = await supabase.auth.getUser();
    let initialDraft: Draft | null = null;

    if (user) {
        const { data: draft } = await supabase
            .from("captions")
            .select("id, text, prompt")
            .eq("user_id", user.id)
            .eq("challenge_date", challenge.date)
            .eq("challenge_text", challenge.id)
            .is("published_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        initialDraft = draft
            ? {
                id: draft.id,
                text: draft.text,
                seed: extractSeedFromGenerationPrompt(draft.prompt ?? ""),
            }
            : null;
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
    }).format(new Date(`${challenge.date}T12:00:00-04:00`));

    return (
        <div className="notice-site write-site found-write-site">
            <SiteHeader isAuthenticated={Boolean(user)} currentPage="write" />

            <main className="found-writing-main">
                <article className="supplemental-file">
                    <span className="supplemental-tab">SUPPLEMENTAL RECORD · {challenge.date.replaceAll("-", ".")}</span>

                    <header className="supplemental-heading">
                        <div>
                            <span>NYC AFTER DARK / PUBLIC SUBMISSION DESK</span>
                            <h1>Add a warning to tonight&apos;s file</h1>
                        </div>
                        <p>{challenge.prompt}</p>
                    </header>

                    <section className="incident-reference" aria-labelledby="writing-incident-title">
                        <div className="incident-reference-photo">
                            <Image
                                src={visual.image}
                                alt=""
                                fill
                                priority
                                sizes="(max-width: 680px) 90vw, 320px"
                                style={{ objectPosition: visual.imagePosition }}
                            />
                        </div>
                        <div className="incident-reference-copy">
                            <span>Incident referenced · {formattedDate}</span>
                            <h2 id="writing-incident-title">{challenge.location}</h2>
                            <p>{challenge.incident}</p>
                            <dl>
                                <div><dt>Reported</dt><dd>{challenge.time}</dd></div>
                                <div><dt>Status</dt><dd>Unresolved</dd></div>
                                <div><dt>Route</dt><dd>{visual.routeLabel}</dd></div>
                            </dl>
                        </div>
                        <Link href="/#tonights-wall">Return to Tonight&apos;s Wall</Link>
                    </section>

                    <section className="found-writing-workspace" aria-labelledby="warning-form-title">
                        <header className="warning-form-heading">
                            <div>
                                <span>Entry form / private until published</span>
                                <h2 id="warning-form-title">Supplemental warning</h2>
                            </div>
                            <p>Submit one instruction. You approve the final wording before it joins the public file.</p>
                        </header>
                        <SubmissionComposer
                            initialDraft={initialDraft}
                            isAuthenticated={Boolean(user)}
                            returnToWallHref="/#tonights-wall"
                            showIntro={false}
                        />
                    </section>

                    <footer className="supplemental-footer">
                        <span>SUBMISSIONS ARE PRIVATE UNTIL PUBLISHED</span>
                        <span>HUMAN SOURCE / AI-ASSISTED EDIT</span>
                    </footer>
                </article>
            </main>

            <SiteFooter />
        </div>
    );
}
