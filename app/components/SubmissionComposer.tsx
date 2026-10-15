"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Draft = {
    id: number;
    text: string;
    seed: string;
};

type SubmissionComposerProps = {
    initialDraft?: Draft | null;
    isAuthenticated: boolean;
    returnToWallHref?: string;
    showIntro?: boolean;
};

const MIN_SEED_LENGTH = 10;
const MAX_SEED_LENGTH = 180;
const MAX_NOTICE_LENGTH = 900;
const SAVED_SEED_KEY = "nyc-after-dark-rule-seed";

const SEED_EXAMPLES = [
    "Do not answer if someone calls your name from an empty room.",
    "Leave before the lights switch off for the third time.",
];

export default function SubmissionComposer({
    initialDraft = null,
    isAuthenticated,
    returnToWallHref = "/#tonights-wall",
    showIntro = true,
}: SubmissionComposerProps) {
    const router = useRouter();
    const [seed, setSeed] = useState(initialDraft?.seed ?? "");
    const [draft, setDraft] = useState<Draft | null>(initialDraft);
    const [draftText, setDraftText] = useState(initialDraft?.text ?? "");
    const [errorMessage, setErrorMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedCaptionId, setPublishedCaptionId] = useState<number | null>(null);
    const [isRevealingDraft, setIsRevealingDraft] = useState(false);
    const [isPasting, setIsPasting] = useState(false);

    useEffect(() => {
        if (initialDraft) {
            return;
        }

        const savedSeed = window.sessionStorage.getItem(SAVED_SEED_KEY);

        if (savedSeed) {
            const frame = window.requestAnimationFrame(() => {
                setSeed((currentSeed) =>
                    currentSeed || savedSeed.slice(0, MAX_SEED_LENGTH)
                );
            });

            return () => window.cancelAnimationFrame(frame);
        }
    }, [initialDraft]);

    function updateSeed(value: string) {
        setSeed(value);
        window.sessionStorage.setItem(SAVED_SEED_KEY, value);
    }

    function focusPublishedSubmission(captionId: number, attempt = 0) {
        window.setTimeout(() => {
            const card = document.querySelector<HTMLElement>(
                `[data-caption-id="${captionId}"]`
            );

            if (card) {
                card.classList.add("just-published");
                card.scrollIntoView({ behavior: "smooth", block: "center" });
                window.setTimeout(() => card.classList.remove("just-published"), 3200);
                return;
            }

            if (attempt < 16) {
                focusPublishedSubmission(captionId, attempt + 1);
            }
        }, attempt === 0 ? 180 : 120);
    }

    async function generateResponse(draftId?: number) {
        setIsGenerating(true);
        setErrorMessage("");
        setPublishedCaptionId(null);

        try {
            if (!isAuthenticated) {
                window.sessionStorage.setItem(SAVED_SEED_KEY, seed);
                const supabase = createClient();
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/write")}`,
                    },
                });

                if (error) {
                    throw new Error("Google sign-in could not be started. Please try again.");
                }

                return;
            }

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seed, draftId }),
            });
            const payload = (await response.json()) as {
                submission?: { id: number; text: string };
                error?: string;
            };

            if (!response.ok || !payload.submission) {
                throw new Error(payload.error ?? "Could not generate a night rule.");
            }

            setDraft({ ...payload.submission, seed });
            setDraftText(payload.submission.text);
            setIsRevealingDraft(true);
            window.setTimeout(() => setIsRevealingDraft(false), 650);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Could not generate a night rule."
            );
        } finally {
            setIsGenerating(false);
        }
    }

    async function publishResponse() {
        if (!draft) {
            return;
        }

        setIsPublishing(true);
        setErrorMessage("");

        try {
            const response = await fetch(`/api/submissions/${draft.id}/publish`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: draftText }),
            });
            const payload = (await response.json()) as { error?: string };

            if (!response.ok) {
                throw new Error(payload.error ?? "Could not publish this rule.");
            }

            const publishedId = draft.id;
            setIsPasting(true);
            setPublishedCaptionId(publishedId);
            setDraft(null);
            setDraftText("");
            setSeed("");
            window.sessionStorage.removeItem(SAVED_SEED_KEY);
            router.refresh();
            focusPublishedSubmission(publishedId);
            window.setTimeout(() => setIsPasting(false), 300);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Could not publish this rule."
            );
        } finally {
            setIsPublishing(false);
        }
    }

    const trimmedSeedLength = seed.trim().length;
    const canGenerate =
        trimmedSeedLength >= MIN_SEED_LENGTH && trimmedSeedLength <= MAX_SEED_LENGTH;
    const draftWordCount = draftText.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)?.length ?? 0;

    return (
        <section
            className={`creation-zone${isPasting ? " is-pasting" : ""}${showIntro ? "" : " no-composer-intro"}`}
            aria-labelledby="composer-title"
        >
            <ol className="composer-progress" aria-label="Creation progress">
                <li className={!draft && !publishedCaptionId ? "is-current" : "is-complete"}>
                    Write
                </li>
                <li className={draft ? "is-current" : publishedCaptionId ? "is-complete" : ""}>
                    Draft
                </li>
                <li className={publishedCaptionId ? "is-current" : ""}>Publish</li>
            </ol>

            {publishedCaptionId && (
                <div className="publish-confirmation" role="status">
                    <span className="publish-stamp" aria-hidden="true">POSTED</span>
                    <div>
                        <strong>Notice #{String(publishedCaptionId).padStart(3, "0")} is live.</strong>
                        <p>It has been pasted onto Tonight&apos;s Wall and is ready for canon votes.</p>
                        <Link className="published-wall-link" href={returnToWallHref}>
                            Return to Tonight&apos;s Wall
                        </Link>
                    </div>
                </div>
            )}

            <div className="composer" id="submission-composer">
                {!draft ? (
                    <>
                        {showIntro ? (
                            <div className="composer-heading">
                                <span className="step-stamp">SUPPLEMENTAL RECORD / OPEN</span>
                                <h2 id="composer-title">Add a Warning</h2>
                                <p>Start with the action, warning, or ritual people must follow tonight.</p>
                            </div>
                        ) : (
                            <h2 className="sr-only" id="composer-title">New warning record</h2>
                        )}

                        <div className="composer-input-row">
                            <label htmlFor="rule-seed">Your original instruction</label>
                            <textarea
                                id="rule-seed"
                                minLength={MIN_SEED_LENGTH}
                                maxLength={MAX_SEED_LENGTH}
                                required
                                placeholder="e.g. If the conductor says your name, do not answer..."
                                value={seed}
                                onChange={(event) => updateSeed(event.target.value)}
                                aria-describedby="rule-seed-help rule-seed-count"
                            />
                            <div className="seed-help" id="rule-seed-help">
                                <span>Try an example:</span>
                                {SEED_EXAMPLES.map((example) => (
                                    <button
                                        key={example}
                                        type="button"
                                        onClick={() => updateSeed(example)}
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                            <div className="seed-input-footer">
                                <span>{isAuthenticated ? "Private until you publish" : "Sign in required to generate"}</span>
                                <span id="rule-seed-count">{seed.length} / {MAX_SEED_LENGTH}</span>
                            </div>
                            <button
                                className="generate-button"
                                type="button"
                                disabled={isGenerating || !canGenerate}
                                onClick={() => generateResponse()}
                            >
                                {isGenerating
                                    ? (isAuthenticated ? "WRITING THE NOTICE..." : "OPENING GOOGLE SIGN-IN...")
                                    : (isAuthenticated ? "GENERATE PRIVATE NOTICE" : "SIGN IN TO CREATE")}
                            </button>
                            {!isAuthenticated && (
                                <small className="guest-note">
                                    Your seed stays in this browser while Google sign-in completes.
                                    Browsing and voting totals remain public.
                                </small>
                            )}
                        </div>
                    </>
                ) : (
                    <div className={`draft-stage${isRevealingDraft ? " is-revealing" : ""}`}>
                        <div className="draft-paper-header">
                            <div>
                                <span className="step-stamp">UNPUBLISHED NOTICE</span>
                                <h2 id="composer-title">Edit the Draft</h2>
                            </div>
                            <span className="draft-number">NO. {String(draft.id).padStart(3, "0")}</span>
                        </div>
                        <div className="saved-draft-label">
                            <span aria-hidden="true">●</span> PRIVATE DRAFT / SAVED TO YOUR ACCOUNT
                        </div>
                        <label htmlFor="draft-response">Notice copy — edit directly on the paper</label>
                        <textarea
                            id="draft-response"
                            className="draft-response"
                            maxLength={MAX_NOTICE_LENGTH}
                            value={draftText}
                            onChange={(event) => setDraftText(event.target.value)}
                        />
                        <div className="draft-meta">
                            <span>{draftWordCount} words · 15–40 recommended</span>
                            <span>{draftText.length} / {MAX_NOTICE_LENGTH} characters</span>
                        </div>
                        <div className="draft-button-row">
                            <button
                                className="regenerate-button"
                                type="button"
                                disabled={isGenerating || isPublishing || !canGenerate}
                                onClick={() => generateResponse(draft.id)}
                            >
                                {isGenerating ? "WRITING ANOTHER..." : "REGENERATE"}
                            </button>
                            <button
                                className="publish-button"
                                type="button"
                                disabled={isPublishing || isGenerating || !draftText.trim()}
                                onClick={publishResponse}
                            >
                                {isPublishing ? "PASTING TO THE WALL..." : "PUBLISH NOTICE"}
                            </button>
                        </div>
                        <p className="draft-lock-note">
                            Publishing is final for this notice. Published notices cannot be regenerated.
                        </p>
                    </div>
                )}

                {errorMessage && (
                    <p className="composer-error" role="alert">
                        {errorMessage}
                    </p>
                )}
            </div>

        </section>
    );
}
