"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ProfilePhotoUploadProps = {
    userId: string;
    initialPhotoUrl: string | null;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export default function ProfilePhotoUpload({
                                               userId,
                                               initialPhotoUrl,
                                           }: ProfilePhotoUploadProps) {
    const router = useRouter();

    const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl ?? "");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    async function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Please choose an image file.");
            setSuccessMessage("");
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setErrorMessage("Image must be smaller than 5 MB.");
            setSuccessMessage("");
            return;
        }

        setIsUploading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const supabase = createClient();

        const extension =
            file.name.split(".").pop()?.toLowerCase() ?? "jpg";

        const filePath =
            `${userId}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Avatar upload failed:", uploadError.message);
            setErrorMessage("Could not upload the image.");
            setIsUploading(false);
            return;
        }

        const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        const newPhotoUrl = data.publicUrl;

        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                profile_photo_url: newPhotoUrl,
            })
            .eq("id", userId);

        if (profileError) {
            console.error(
                "Profile photo update failed:",
                profileError.message
            );
            setErrorMessage(
                "Image uploaded, but profile could not be updated."
            );
            setIsUploading(false);
            return;
        }

        setPhotoUrl(newPhotoUrl);
        setSuccessMessage("Profile photo updated.");
        setIsUploading(false);

        router.refresh();
    }

    return (
        <section className="profile-photo-section">
            <h2>Profile photo</h2>

            {photoUrl ? (
                <img
                    className="profile-avatar"
                    src={photoUrl}
                    alt="Profile"
                    width={160}
                    height={160}
                />
            ) : (
                <p className="profile-photo-empty">
                    No profile photo yet.
                </p>
            )}

            <label
                className="profile-photo-button"
                htmlFor="profile-photo"
            >
                {isUploading ? "Uploading..." : "Choose a photo"}
            </label>

            <input
                id="profile-photo"
                className="profile-photo-input"
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={handleFileChange}
            />

            {errorMessage && (
                <p className="profile-error">{errorMessage}</p>
            )}

            {successMessage && (
                <p className="profile-success">{successMessage}</p>
            )}
        </section>
    );
}