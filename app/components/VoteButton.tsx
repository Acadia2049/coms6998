"use client";

import { useState } from "react";

type VoteButtonProps = {
    captionId: number;
    initialScore: number;
    initiallyVoted: boolean;
};

export default function VoteButton({
    captionId,
    initialScore,
    initiallyVoted,
}: VoteButtonProps) {
    const [score, setScore] = useState(initialScore);
    const [hasVoted, setHasVoted] = useState(initiallyVoted);
    const [isVoting, setIsVoting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [stampText, setStampText] = useState("");

    async function vote() {
        if (isVoting) {
            return;
        }

        const isUndoing = hasVoted;
        setIsVoting(true);
        setErrorMessage("");

        try {
            const response = await fetch("/api/votes", {
                method: isUndoing ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ captionId }),
            });
            const payload = (await response.json()) as {
                voteScore?: number | null;
                error?: string;
            };

            if (!response.ok) {
                throw new Error(
                    payload.error ?? (isUndoing ? "Could not remove your vote." : "Could not save your vote.")
                );
            }

            setHasVoted(!isUndoing);
            setScore(payload.voteScore ?? (isUndoing ? Math.max(score - 1, 0) : score + 1));
            setStampText(isUndoing ? "REMOVED" : "COUNTED");
            window.setTimeout(() => setStampText(""), 650);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Vote failed.");
        } finally {
            setIsVoting(false);
        }
    }

    return (
        <div className={`vote-control${stampText ? " stamp-active" : ""}`}>
            <button
                className={hasVoted ? "vote-button voted" : "vote-button"}
                type="button"
                disabled={isVoting}
                onClick={vote}
                aria-label={hasVoted ? `Undo canon vote. ${score} votes` : `Make canon. ${score} votes`}
            >
                <span aria-hidden="true">{hasVoted ? "−" : "+"}</span>
                <span>{isVoting ? "Updating…" : hasVoted ? "Undo canon vote" : "Make canon"}</span>
                <strong>{score}</strong>
            </button>
            {stampText && <span className="canon-stamp" aria-hidden="true">{stampText}</span>}
            {errorMessage && <span className="vote-error">{errorMessage}</span>}
        </div>
    );
}
