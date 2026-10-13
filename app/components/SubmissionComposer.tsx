"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
    id: number;
    text: string;
    seed: string;
};

type SubmissionComposerProps = {
    initialDraft?: Draft | null;
};

const MIN_SEED_LENGTH = 10;
const MAX_SEED_LENGTH = 180;
const MAX_NOTICE_LENGTH = 900;

const SEED_EXAMPLES = [
    "Do not answer if someone calls your name from an empty room.",
    "Leave before the lights switch off for the third time.",
];

export default function SubmissionComposer({
    initialDraft = null,
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
            className={`creation-zone${isPasting ? " is-pasting" : ""}`}
            aria-labelledby="composer-title"
        >
            <div className="composer" id="submission-composer">
                {!draft ? (
                    <>
                        <div className="composer-heading">
                            <span className="step-stamp">02 / ADD A RULE</span>
                            <h2 id="composer-title">Your rule seed</h2>
                        </div>

                        <div className="composer-input-row">
                            <label htmlFor="rule-seed">
                                What must people do to survive tonight?
                            </label>
                            <textarea
                                id="rule-seed"
                                minLength={MIN_SEED_LENGTH}
                                maxLength={MAX_SEED_LENGTH}
                                required
                                placeholder="If the conductor says your name..."
                                value={seed}
                                onChange={(event) => setSeed(event.target.value)}
                                aria-describedby="rule-seed-help rule-seed-count"
                            />
                            <div className="seed-help" id="rule-seed-help">
                                <span>Try an example:</span>
                                {SEED_EXAMPLES.map((example) => (
                                    <button
                                        key={example}
                                        type="button"
                                        onClick={() => setSeed(example)}
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                            <div className="seed-input-footer">
                                <span>One rule idea · {MIN_SEED_LENGTH}–{MAX_SEED_LENGTH} characters</span>
                                <span id="rule-seed-count">{seed.length} / {MAX_SEED_LENGTH}</span>
                            </div>
                            <button
                                className="generate-button"
                                type="button"
                                disabled={isGenerating || !canGenerate}
                                onClick={() => generateResponse()}
                            >
                                {isGenerating
                                    ? "WRITING THE NOTICE..."
                                    : "TURN IT INTO A NIGHT RULE →"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={`draft-stage${isRevealingDraft ? " is-revealing" : ""}`}>
                        <div className="composer-heading">
                            <span className="step-stamp">YOUR AI-GENERATED NOTICE</span>
                            <h2 id="composer-title">Review the rule</h2>
                        </div>
                        <div className="saved-draft-label">
                            <span aria-hidden="true">●</span> PRIVATE DRAFT · SAVED
                        </div>
                        <label htmlFor="draft-response">Edit before posting to tonight&apos;s wall</label>
                        <textarea
                            id="draft-response"
                            className="draft-response"
                            maxLength={MAX_NOTICE_LENGTH}
                            value={draftText}
                            onChange={(event) => setDraftText(event.target.value)}
                        />
                        <div className="draft-meta">
                            <span>{draftWordCount} words · 20–35 recommended</span>
                            <span>{draftText.length} / {MAX_NOTICE_LENGTH} characters</span>
                        </div>
                        <div className="draft-button-row">
                            <button
                                className="regenerate-button"
                                type="button"
                                disabled={isGenerating || isPublishing || !canGenerate}
                                onClick={() => generateResponse(draft.id)}
                            >
                                {isGenerating ? "WRITING ANOTHER..." : "TRY ANOTHER VERSION"}
                            </button>
                            <button
                                className="publish-button"
                                type="button"
                                disabled={isPublishing || isGenerating || !draftText.trim()}
                                onClick={publishResponse}
                            >
                                {isPublishing ? "POSTING..." : "POST TO TONIGHT'S WALL →"}
                            </button>
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <p className="composer-error" role="alert">
                        {errorMessage}
                    </p>
                )}
            </div>

            {publishedCaptionId && (
                <span className="sr-only" role="status">
                    Your rule is on tonight&apos;s wall.
                </span>
            )}
        </section>
    );
}
