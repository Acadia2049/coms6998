"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ProfilePhotoUploadProps = {
    userId: string;
    initialPhotoUrl: string | null;
    initials: string;
    isReadOnly?: boolean;
};

const MAX_SOURCE_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_PHOTO_EDGE = 1_600;
const PROFILE_PHOTO_QUALITY = 0.86;

const SUPPORTED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

function loadImage(file: File) {
    return new Promise<{ image: HTMLImageElement; objectUrl: string }>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => resolve({ image, objectUrl });
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not read this image."));
        };
        image.src = objectUrl;
    });
}

async function resizeProfilePhoto(file: File) {
    const { image, objectUrl } = await loadImage(file);

    try {
        const scale = Math.min(
            1,
            MAX_PROFILE_PHOTO_EDGE / Math.max(image.naturalWidth, image.naturalHeight)
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not prepare this image.");
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const resizedBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => blob ? resolve(blob) : reject(new Error("Could not prepare this image.")),
                "image/webp",
                PROFILE_PHOTO_QUALITY
            );
        });

        if (resizedBlob.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
            throw new Error("This image is still too large after resizing. Try a smaller photo.");
        }

        return new File([resizedBlob], "profile-photo.webp", {
            type: "image/webp",
            lastModified: Date.now(),
        });
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export default function ProfilePhotoUpload({
                                               userId,
                                               initialPhotoUrl,
                                               initials,
                                               isReadOnly = false,
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

        if (isReadOnly) {
            return;
        }

        if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
            setErrorMessage("Please choose a JPG, PNG, or WebP image.");
            setSuccessMessage("");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_SOURCE_FILE_SIZE_BYTES) {
            setErrorMessage("Please choose an image smaller than 25 MB.");
            setSuccessMessage("");
            event.target.value = "";
            return;
        }

        setIsUploading(true);
        setErrorMessage("");
        setSuccessMessage("");

        let uploadFile: File;

        try {
            uploadFile = await resizeProfilePhoto(file);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Could not prepare this image."
            );
            setIsUploading(false);
            event.target.value = "";
            return;
        }

        const supabase = createClient();
        const filePath = `${userId}/${crypto.randomUUID()}.webp`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, uploadFile, {
                contentType: uploadFile.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Avatar upload failed:", uploadError.message);
            setErrorMessage("Could not upload the image.");
            setIsUploading(false);
            event.target.value = "";
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
            event.target.value = "";
            return;
        }

        setPhotoUrl(newPhotoUrl);
        setSuccessMessage("Profile photo resized and updated.");
        setIsUploading(false);
        event.target.value = "";

        router.refresh();
    }

    return (
        <section className="profile-photo-section">
            {photoUrl ? (
                <img
                    className="profile-avatar"
                    src={photoUrl}
                    alt="Profile"
                    width={160}
                    height={160}
                />
            ) : (
                <div className="profile-avatar profile-avatar-empty" aria-label="No profile photo">
                    <strong aria-hidden="true">{initials}</strong>
                    <span>No image filed</span>
                </div>
            )}

            <div className="profile-photo-feedback" aria-live="polite">
                {errorMessage && (
                    <p className="profile-error">{errorMessage}</p>
                )}

                {successMessage && (
                    <p className="profile-success">{successMessage}</p>
                )}
            </div>

            <label
                className="profile-photo-button"
                htmlFor="profile-photo"
            >
                {isReadOnly ? "Preview only" : isUploading ? "Resizing & uploading..." : "Choose a photo"}
            </label>

            <input
                id="profile-photo"
                className="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploading || isReadOnly}
                onChange={handleFileChange}
            />
        </section>
    );
}
