import DeleteSubmissionButton from "./DeleteSubmissionButton";
import VoteButton from "./VoteButton";

type CaptionCardProps = {
    id: number;
    text: string;
    voteScore: number;
    hasVoted: boolean;
    canVote: boolean;
    canDelete: boolean;
    index: number;
    isTop: boolean;
};

export default function CaptionCard({
    id,
    text,
    voteScore,
    hasVoted,
    canVote,
    canDelete,
    index,
    isTop,
}: CaptionCardProps) {
    const rank = index + 1;
    return (
        <article
            className={`rule-notice wall-note wall-stencil wall-position-${(index % 6) + 1}`}
            data-caption-id={id}
            id={`notice-${id}`}
        >
            <header className="rule-notice-header">
                <span>Rule {String(rank).padStart(2, "0")}</span>
                {isTop && <span className="leading-rule">Most confirmed</span>}
            </header>
            <p className="rule-copy">{text}</p>
            <footer className="rule-notice-footer">
                <div className="rule-card-actions">
                    {canVote ? (
                        <VoteButton
                            captionId={id}
                            initialScore={voteScore}
                            initiallyVoted={hasVoted}
                        />
                    ) : (
                        <span className="vote-login-note">Sign in to vote · {voteScore} canon votes</span>
                    )}
                    {canDelete && <DeleteSubmissionButton captionId={id} />}
                </div>
            </footer>
        </article>
    );
}
