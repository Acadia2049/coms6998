import Link from "next/link";
import { redirect } from "next/navigation";

import ProfileForm from "@/app/components/ProfileForm";
import ProfilePhotoUpload from "@/app/components/ProfilePhotoUpload";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, profile_photo_url")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile fetch failed:", error.message);

        return (
            <main className="page-container">
                <h1>Profile</h1>
                <p>Could not load your profile.</p>

                <p>
                    <Link href="/">Back to home</Link>
                </p>
            </main>
        );
    }

    return (
        <main className="page-container">
            <h1>Profile</h1>

            <p>Email: {user.email}</p>

            <ProfilePhotoUpload
                userId={user.id}
                initialPhotoUrl={profile?.profile_photo_url ?? null}
            />

            <ProfileForm
                userId={user.id}
                initialFirstName={profile?.first_name ?? null}
                initialLastName={profile?.last_name ?? null}
            />

            <p>
                <Link href="/">Back to home</Link>
            </p>
        </main>
    );
}