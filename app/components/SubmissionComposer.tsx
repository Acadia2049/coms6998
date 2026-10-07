"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
    id: number;
    text: string;
};

type SubmissionComposerProps = {
    initialDraft?: Draft | null;
};

function SprayBurst({ className = "" }: { className?: string }) {
    return (
        <span className={`spray-burst ${className}`.trim()} aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
                <i key={index} />
            ))}
        </span>
    );
}

export default function SubmissionComposer({
    initialDraft = null,
}: SubmissionComposerProps) {
    const router = useRouter();
    const angleInputRef = useRef<HTMLTextAreaElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const [angle, setAngle] = useState("");
    const [draft, setDraft] = useState<Draft | null>(initialDraft);
    const [draftText, setDraftText] = useState(initialDraft?.text ?? "");
    const [errorMessage, setErrorMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedCaptionId, setPublishedCaptionId] = useState<number | null>(null);
    const [hasPickedUpCan, setHasPickedUpCan] = useState(Boolean(initialDraft));
    const [isPickingUpCan, setIsPickingUpCan] = useState(false);
    const [showGenerateSpray, setShowGenerateSpray] = useState(false);
    const [isRevealingDraft, setIsRevealingDraft] = useState(false);
    const [isPasting, setIsPasting] = useState(false);

    function pickUpCan() {
        if (isPickingUpCan) {
            return;
        }

        setIsPickingUpCan(true);
        window.setTimeout(() => {
            setHasPickedUpCan(true);
            setIsPickingUpCan(false);
            window.requestAnimationFrame(() => {
                composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                angleInputRef.current?.focus({ preventScroll: true });
            });
        }, 440);
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

    async function generateResponse() {
        setIsGenerating(true);
        setErrorMessage("");
        setPublishedCaptionId(null);
        setShowGenerateSpray(true);
        window.setTimeout(() => setShowGenerateSpray(false), 560);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ angle }),
            });
            const payload = (await response.json()) as {
                submission?: Draft;
                error?: string;
            };

            if (!response.ok || !payload.submission) {
                throw new Error(payload.error ?? "Could not generate a response.");
            }

            setDraft(payload.submission);
            setDraftText(payload.submission.text);
            setIsRevealingDraft(true);
            window.setTimeout(() => setIsRevealingDraft(false), 650);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Could not generate a response."
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
                throw new Error(payload.error ?? "Could not publish this response.");
            }

            const publishedId = draft.id;
            setIsPasting(true);
            setPublishedCaptionId(publishedId);
            setDraft(null);
            setDraftText("");
            setAngle("");
            router.refresh();
            focusPublishedSubmission(publishedId);
            window.setTimeout(() => setIsPasting(false), 300);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Could not publish this response."
            );
        } finally {
            setIsPublishing(false);
        }
    }

    return (
        <section className={`creation-zone${isPasting ? " is-pasting" : ""}`} aria-labelledby="composer-title">
            {!hasPickedUpCan ? (
                <div className="pickup-panel">
                    <span className="step-stamp">02 / YOUR TURN</span>
                    <h2 id="composer-title">Leave a mark.</h2>
                    <p>Pick up the can, give the AI an angle, and make tonight&apos;s challenge yours.</p>
                    <button
                        className={`pickup-button${isPickingUpCan ? " is-spraying" : ""}`}
                        type="button"
                        disabled={isPickingUpCan}
                        onClick={pickUpCan}
                        aria-controls="submission-composer"
                    >
                        <span>{isPickingUpCan ? "PSHHT..." : "PICK UP THE CAN"}</span>
                        <span aria-hidden="true">↗</span>
                        {isPickingUpCan && <SprayBurst />}
                    </button>
                </div>
            ) : (
                <div className="composer" id="submission-composer" ref={composerRef}>
                    <div className="composer-heading">
                        <span className="step-stamp">02 / MAKE YOUR DROP</span>
                        <h2 id="composer-title">Your angle</h2>
                    </div>

                    {!draft ? (
                        <div className="composer-input-row">
                            <label className="sr-only" htmlFor="personal-angle">
                                Your angle
                            </label>
                            <textarea
                                ref={angleInputRef}
                                id="personal-angle"
                                maxLength={280}
                                placeholder="What&apos;s your take? Give the AI a direction..."
                                value={angle}
                                onChange={(event) => setAngle(event.target.value)}
                            />
                            <button
                                className={`generate-button${isGenerating ? " is-spraying" : ""}`}
                                type="button"
                                disabled={isGenerating}
                                onClick={generateResponse}
                            >
                                {isGenerating ? "SPRAYING..." : "SPRAY IT →"}
                                {showGenerateSpray && <SprayBurst className="generate-spray-burst" />}
                            </button>
                        </div>
                    ) : (
                        <div className={`draft-stage${isRevealingDraft ? " is-revealing" : ""}`}>
                            <div className="saved-draft-label">
                                <span aria-hidden="true">●</span> PRIVATE DRAFT · SAVED
                            </div>
                            <label htmlFor="draft-response">Edit before it hits the wall</label>
                            <textarea
                                id="draft-response"
                                className="draft-response"
                                maxLength={600}
                                value={draftText}
                                onChange={(event) => setDraftText(event.target.value)}
                            />
                            <div className="draft-actions">
                                <span>{draftText.length}/600</span>
                                <button
                                    className="publish-button"
                                    type="button"
                                    disabled={isPublishing || !draftText.trim()}
                                    onClick={publishResponse}
                                >
                                    {isPublishing ? "PASTING..." : "PUT IT ON THE WALL →"}
                                </button>
                            </div>
                        </div>
                    )}

                    {errorMessage && <p className="composer-error">{errorMessage}</p>}
                </div>
            )}

            {publishedCaptionId && (
                <span className="sr-only" role="status">Your response is on tonight&apos;s wall.</span>
            )}
        </section>
    );
}
