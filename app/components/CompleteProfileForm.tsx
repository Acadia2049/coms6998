"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type CompleteProfileFormProps = {
    userId: string;
    initialFirstName?: string | null;
    initialLastName?: string | null;
};

export default function CompleteProfileForm({
                                                userId,
                                                initialFirstName,
                                                initialLastName,
                                            }: CompleteProfileFormProps) {
    const router = useRouter();

    const [firstName, setFirstName] = useState(initialFirstName ?? "");
    const [lastName, setLastName] = useState(initialLastName ?? "");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();

        if (!trimmedFirstName || !trimmedLastName) {
            setErrorMessage("Please enter both your first and last name.");
            return;
        }

        setIsSaving(true);
        setErrorMessage("");

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

        router.refresh();
    }

    return (
        <section className="profile-form-section">
            <h2>Complete your profile</h2>
            <p>Please add your first and last name to continue.</p>

            <form className="profile-form" onSubmit={handleSubmit}>
                <div className="profile-field">
                    <label htmlFor="first-name">First name</label>
                    <input
                        id="first-name"
                        className="profile-input"
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                    />
                </div>

                <div className="profile-field">
                    <label htmlFor="last-name">Last name</label>
                    <input
                        id="last-name"
                        className="profile-input"
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                    />
                </div>

                {errorMessage && (
                    <p className="profile-error">{errorMessage}</p>
                )}

                <button
                    type="submit"
                    className="google-sign-in-button"
                    disabled={isSaving}
                >
                    {isSaving ? "Saving..." : "Save profile"}
                </button>
            </form>
        </section>
    );
}