import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import SubmissionComposer from "@/app/components/SubmissionComposer";
import { extractSeedFromGenerationPrompt, getTonightChallenge } from "@/lib/challenges";
import { getSceneVisual } from "@/lib/scene-visuals";
import { createClient } from "@/lib/supabase/server";
import { getUserFirstName } from "@/lib/user-name";

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

    if (!user) {
        redirect("/#join-wall");
    }

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

    return (
        <div className="notice-site write-site found-write-site">
            <SiteHeader
                isAuthenticated={Boolean(user)}
                currentPage="write"
                accountName={user ? getUserFirstName(user) : undefined}
            />

            <main className="found-writing-main">
                <article className="supplemental-file">
                    <span className="supplemental-tab">TONIGHT · {challenge.date.replaceAll("-", ".")}</span>

                    <header className="supplemental-heading">
                        <div>
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
                            <h2 id="writing-incident-title">{challenge.location}</h2>
                            <p>{challenge.incident}</p>
                        </div>
                        <Link href="/#tonights-wall">Return to Tonight&apos;s Wall</Link>
                    </section>

                    <section className="found-writing-workspace" aria-label="Warning entry form">
                        <p className="warning-form-note">
                            Private until published. You approve the final wording before it joins the wall.
                        </p>
                        <SubmissionComposer
                            initialDraft={initialDraft}
                            isAuthenticated
                            returnToWallHref="/#tonights-wall"
                            showIntro={false}
                        />
                    </section>

                </article>
            </main>

            <SiteFooter />
        </div>
    );
}
