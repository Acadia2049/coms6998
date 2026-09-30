"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
    userId: string;
    initialFirstName: string | null;
    initialLastName: string | null;
};

export default function ProfileForm({
                                        userId,
                                        initialFirstName,
                                        initialLastName,
                                    }: ProfileFormProps) {
    const router = useRouter();

    const [firstName, setFirstName] = useState(initialFirstName ?? "");
    const [lastName, setLastName] = useState(initialLastName ?? "");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();

        if (!trimmedFirstName || !trimmedLastName) {
            setErrorMessage("Please enter both your first and last name.");
            setSuccessMessage("");
            return;
        }

        setIsSaving(true);
        setErrorMessage("");
        setSuccessMessage("");

        const supabase = createClient();

        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: trimmedFirstName,
                last_name: trimmedLastName,
            })
            .eq("id", userId);

        if (error) {
            console.error("Profile update failed:", error.message);
            setErrorMessage("Could not save your profile.");
            setIsSaving(false);
            return;
        }

        setSuccessMessage("Profile saved.");
        setIsSaving(false);
        router.refresh();
    }

    return (
        <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
                <label htmlFor="profile-first-name">First name</label>
                <input
                    id="profile-first-name"
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                />
            </div>

            <div className="profile-field">
                <label htmlFor="profile-last-name">Last name</label>
                <input
                    id="profile-last-name"
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                />
            </div>

            {errorMessage && (
                <p className="profile-error">{errorMessage}</p>
            )}

            {successMessage && (
                <p className="profile-success">{successMessage}</p>
            )}

            <button
                className="profile-save-button"
                type="submit"
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save changes"}
            </button>
        </form>
    );
}