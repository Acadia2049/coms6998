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
    const [justStamped, setJustStamped] = useState(false);

    async function vote() {
        if (hasVoted || isVoting) {
            return;
        }

        setIsVoting(true);
        setErrorMessage("");

        try {
            const response = await fetch("/api/votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ captionId }),
            });
            const payload = (await response.json()) as {
                voteScore?: number | null;
                error?: string;
            };

            if (!response.ok) {
                throw new Error(payload.error ?? "Could not save your vote.");
            }

            setHasVoted(true);
            setScore(payload.voteScore ?? score + 1);
            setJustStamped(true);
            window.setTimeout(() => setJustStamped(false), 650);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Vote failed.");
        } finally {
            setIsVoting(false);
        }
    }

    return (
        <div className={`vote-control${justStamped ? " stamp-active" : ""}`}>
            <button
                className={hasVoted ? "vote-button voted" : "vote-button"}
                type="button"
                disabled={hasVoted || isVoting}
                onClick={vote}
                aria-label={hasVoted ? `Voted. ${score} fire votes` : `Give a fire vote. ${score} votes`}
            >
                <span aria-hidden="true">{hasVoted ? "✓" : "🔥"}</span>
                <span>{hasVoted ? "Stamped" : "Fire"}</span>
                <strong>{score}</strong>
            </button>
            {justStamped && <span className="fire-stamp" aria-hidden="true">FIRE</span>}
            {errorMessage && <span className="vote-error">{errorMessage}</span>}
        </div>
    );
}
