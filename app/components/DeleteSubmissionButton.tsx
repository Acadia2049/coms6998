"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type DeleteSubmissionButtonProps = {
    captionId: number;
};

export default function DeleteSubmissionButton({ captionId }: DeleteSubmissionButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!isConfirming) {
            return;
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsConfirming(false);
            }
        }

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [isConfirming]);

    async function deleteSubmission() {
        setIsConfirming(false);
        setIsDeleting(true);
        setErrorMessage("");

        try {
            const response = await fetch(`/api/submissions/${captionId}`, { method: "DELETE" });
            const payload = (await response.json()) as { error?: string };

            if (!response.ok) {
                throw new Error(payload.error ?? "Could not delete this rule.");
            }

            router.refresh();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Deletion failed.");
            setIsDeleting(false);
        }
    }

    return (
        <div className="delete-submission-control">
            <button
                className="delete-submission-button"
                type="button"
                disabled={isDeleting}
                onClick={() => {
                    setErrorMessage("");
                    setIsConfirming(true);
                }}
            >
                {isDeleting ? "Removing…" : "Delete my rule"}
            </button>
            {errorMessage && <span className="vote-error" role="alert">{errorMessage}</span>}

            {isConfirming && createPortal(
                <div
                    className="delete-dialog-backdrop"
                    role="presentation"
                    onClick={() => setIsConfirming(false)}
                >
                    <section
                        className="delete-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby={`delete-dialog-title-${captionId}`}
                        aria-describedby={`delete-dialog-copy-${captionId}`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <span className="delete-dialog-kicker">Published warning</span>
                        <h2 id={`delete-dialog-title-${captionId}`}>Remove this rule?</h2>
                        <p id={`delete-dialog-copy-${captionId}`}>
                            Its votes will also be removed. This cannot be undone.
                        </p>
                        <div className="delete-dialog-actions">
                            <button
                                className="delete-dialog-cancel"
                                type="button"
                                autoFocus
                                onClick={() => setIsConfirming(false)}
                            >
                                Keep rule
                            </button>
                            <button
                                className="delete-dialog-confirm"
                                type="button"
                                onClick={deleteSubmission}
                            >
                                Delete rule
                            </button>
                        </div>
                    </section>
                </div>,
                document.body
            )}
        </div>
    );
}
