type CaptionCardProps = {
    id: number;
    text: string;
};

export default function CaptionCard({
                                        id,
                                        text,
                                    }: CaptionCardProps) {
    return (
        <article className="caption-card">
            <span className="caption-number">Caption #{id}</span>
            <p className="caption-text">{text}</p>
        </article>
    );
}