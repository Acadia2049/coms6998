import VoteButton from "./VoteButton";

type CaptionCardProps = {
    id: number;
    text: string;
    voteScore: number;
    hasVoted: boolean;
    canVote: boolean;
    index: number;
    isTop: boolean;
};

export default function CaptionCard({
    id,
    text,
    voteScore,
    hasVoted,
    canVote,
    index,
    isTop,
}: CaptionCardProps) {
    const medium = text.length <= 86 ? "sticker" : text.length <= 180 ? "stencil" : "wheatpaste";

    return (
        <article
            className={`caption-card medium-${medium} wall-position-${(index % 6) + 1}`}
            data-caption-id={id}
        >
            <div className="poster-tape" aria-hidden="true" />
            {isTop && <span className="top-sticker">TONIGHT&apos;S HOTTEST</span>}
            <span className="caption-number">DROP #{String(id).padStart(3, "0")}</span>
            <p className="caption-text">{text}</p>
            <footer className="caption-footer">
                {canVote ? (
                    <VoteButton
                        captionId={id}
                        initialScore={voteScore}
                        initiallyVoted={hasVoted}
                    />
                ) : (
                    <span className="vote-login-note">Sign in to vote · 🔥 {voteScore}</span>
                )}
            </footer>
        </article>
    );
}
