"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteSubmissionButtonProps = {
    captionId: number;
};

export default function DeleteSubmissionButton({ captionId }: DeleteSubmissionButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function deleteSubmission() {
        const confirmed = window.confirm(
            "Delete this published rule? Its votes will also be removed. This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

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
                onClick={deleteSubmission}
            >
                {isDeleting ? "Removing…" : "Delete my rule"}
            </button>
            {errorMessage && <span className="vote-error" role="alert">{errorMessage}</span>}
        </div>
    );
}
