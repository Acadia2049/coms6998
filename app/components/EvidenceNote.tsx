"use client";

import { useState } from "react";

type EvidenceNoteProps = {
    detail: string;
    hiddenNote: string;
    title: string;
    variant: "ticket" | "record" | "service";
};

export default function EvidenceNote({
    detail,
    hiddenNote,
    title,
    variant,
}: EvidenceNoteProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`evidence-note evidence-note-${variant}${isOpen ? " is-open" : ""}`}>
            <p className="evidence-note-hidden" aria-hidden={!isOpen}>
                {hiddenNote}
            </p>
            <button
                className="evidence-slip"
                type="button"
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Hide" : "Reveal"} note attached to ${title}`}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span>{title}</span>
                <strong>{detail}</strong>
                <small>{isOpen ? "close note" : "lift note"}</small>
            </button>
        </div>
    );
}
