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
            className={`rule-notice notice-variant-${(index % 3) + 1}`}
            data-caption-id={id}
        >
            <header className="rule-notice-header">
                <span>ACTIVE / NIGHT GUIDANCE</span>
                <span>PRIORITY {String(rank).padStart(2, "0")}</span>
            </header>
            {isTop && <span className="leading-rule">CURRENT PRIMARY</span>}
            <span className="rule-number">NOTICE {String(id).padStart(4, "0")}</span>
            <p className="rule-copy">{text}</p>
            <p className="ai-disclosure">PUBLIC SUBMISSION · AI-ASSISTED EDIT</p>
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
