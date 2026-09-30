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
            <span className="caption-quote" aria-hidden="true">
                &ldquo;
            </span>
            <p className="caption-text">{text}</p>
            <footer className="caption-footer">
                <span>Saved caption</span>
                <span className="caption-number">#{id}</span>
            </footer>
        </article>
    );
}
