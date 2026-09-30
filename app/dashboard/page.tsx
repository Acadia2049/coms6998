import Link from "next/link";

import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import SignOutButton from "@/app/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();


    if (!user) {
        return (
            <main className="page-container">
                <section className="dashboard-card">
                    <h1>Dashboard</h1>

                    <h2 className="dashboard-signin-title">
                        Sign in required
                    </h2>

                    <p className="dashboard-description">
                        You must be signed in to view this page.
                    </p>

                    <GoogleSignInButton />

                    <div className="dashboard-links">
                        <Link href="/">Back to home</Link>
                    </div>
                </section>
            </main>
        );
    }


    const { data: profile, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, profile_photo_url")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Dashboard profile fetch failed:", error.message);
    }

    const displayName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
        : user.email;
    return (
        <main className="page-container">
            <section className="dashboard-card">
                <h1>Dashboard</h1>

                <p className="dashboard-welcome">
                    Welcome, {displayName}!
                </p>

                <p className="dashboard-description">
                    This content is only visible to signed-in users.
                </p>

                {profile?.profile_photo_url && (
                    <img
                        className="dashboard-avatar"
                        src={profile.profile_photo_url}
                        alt="Profile"
                        width={120}
                        height={120}
                    />
                )}

                <p>
                    <strong>Email:</strong> {user.email}
                </p>

                <div className="dashboard-links">
                    <Link href="/profile">Edit profile</Link>
                    <Link href="/">Back to home</Link>
                </div>

                <SignOutButton />
            </section>
        </main>
    );
}