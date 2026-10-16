import Link from "next/link";
import { redirect } from "next/navigation";

import ProfileForm from "@/app/components/ProfileForm";
import ProfilePhotoUpload from "@/app/components/ProfilePhotoUpload";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { getUserFirstName, getUserNameParts } from "@/lib/user-name";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
    searchParams: Promise<{ preview?: string | string[] }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
    const supabase = await createClient();
    const requestedPreview = (await searchParams).preview;
    const isDevelopmentPreview =
        process.env.NODE_ENV === "development" && requestedPreview === "1";

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isDevelopmentPreview) {
        redirect("/");
    }

    const { data: profile, error } = user
        ? await supabase
            .from("profiles")
            .select("first_name, last_name, profile_photo_url")
            .eq("id", user.id)
            .maybeSingle()
        : { data: null, error: null };

    const inferredName = user
        ? getUserNameParts(user)
        : { firstName: "Night", lastName: "Witness" };
    const firstName = profile?.first_name || inferredName.firstName || "Night";
    const lastName = profile?.last_name || inferredName.lastName || "Witness";
    const displayName = `${firstName} ${lastName}`.trim();
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    const userId = user?.id ?? "preview-6998";
    const userEmail = user?.email ?? "night.witness@example.com";

    return (
        <div className="notice-site living-wall-site profile-wall-site">
            <SiteHeader
                isAuthenticated
                currentPage="profile"
                accountName={user ? getUserFirstName(user) : "Night"}
            />

            <main className="profile-wall-main">
                <section className="profile-wall" aria-labelledby="profile-title">
                    <header className="profile-title-poster">
                        <span className="profile-kicker">Witness file / active contributor</span>
                        <h1 id="profile-title">Your night <em>profile</em></h1>
                        <p>
                            Keep the name and photograph attached to your warnings current.
                            Your email remains private and is only used to identify your account.
                        </p>
                        <dl>
                            <div><dt>Status</dt><dd>Verified</dd></div>
                            <div><dt>File</dt><dd>{userId.slice(0, 8).toUpperCase()}</dd></div>
                        </dl>
                        <span className="profile-handnote" aria-hidden="true">seen after midnight</span>
                    </header>

                    <div className="profile-photo-wrap">
                        <span className="profile-photo-label">CURRENT LIKENESS</span>
                        <ProfilePhotoUpload
                            userId={userId}
                            initialPhotoUrl={profile?.profile_photo_url ?? null}
                            initials={initials}
                            isReadOnly={isDevelopmentPreview}
                        />
                    </div>

                    <section className="profile-details-sheet" aria-labelledby="identity-details-title">
                        <div className="profile-sheet-heading">
                            <span>Identification / editable</span>
                            <small>NYC–AD · MEMBER RECORD</small>
                        </div>
                        <h2 id="identity-details-title">{displayName}</h2>
                        <div className="profile-email-row">
                            <span>Account email</span>
                            <strong>{userEmail}</strong>
                        </div>

                        {error ? (
                            <div className="profile-load-error">
                                <p>We could not load the saved version of this file.</p>
                                <Link href="/">Return to tonight&apos;s wall</Link>
                            </div>
                        ) : (
                            <ProfileForm
                                userId={userId}
                                initialFirstName={profile?.first_name || inferredName.firstName || null}
                                initialLastName={profile?.last_name || inferredName.lastName || null}
                                isReadOnly={isDevelopmentPreview}
                            />
                        )}
                    </section>

                    <Link className="profile-back-link" href="/">
                        ← Return to tonight&apos;s wall
                    </Link>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
