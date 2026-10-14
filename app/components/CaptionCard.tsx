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
    const rank = index + 1;

    return (
        <article
            className={`rule-notice notice-variant-${(index % 3) + 1}`}
            data-caption-id={id}
        >
            <div className="notice-fastener" aria-hidden="true" />
            <header className="rule-notice-header">
                <span>PUBLISHED / TONIGHT&apos;S WALL</span>
                <span>RANK {String(rank).padStart(2, "0")}</span>
            </header>
            {isTop && <span className="leading-rule">LEADING RULE</span>}
            <span className="rule-number">RULE #{String(id).padStart(3, "0")}</span>
            <p className="rule-copy">{text}</p>
            <p className="ai-disclosure">AI GENERATED FROM A HUMAN SEED</p>
            <footer className="rule-notice-footer">
                {canVote ? (
                    <VoteButton
                        captionId={id}
                        initialScore={voteScore}
                        initiallyVoted={hasVoted}
                    />
                ) : (
                    <span className="vote-login-note">Sign in to vote · {voteScore} canon votes</span>
                )}
            </footer>
        </article>
    );
}
