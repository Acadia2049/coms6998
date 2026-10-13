import Link from "next/link";

import GoogleSignInButton from "./GoogleSignInButton";
import SignOutButton from "./SignOutButton";

type SiteHeaderProps = {
    isAuthenticated: boolean;
};

export default function SiteHeader({ isAuthenticated }: SiteHeaderProps) {
    return (
        <header className="site-header">
            <Link className="site-brand" href="/" aria-label="NYC After Dark home">
                <span className="site-brand-city">NYC</span>
                <span>AFTER DARK</span>
            </Link>

            <nav className="site-nav" aria-label="Main navigation">
                <Link href="/#tonights-wall">Tonight&apos;s Wall</Link>
                <Link href="/past-nights">Past Nights</Link>
                <Link href="/#how-it-works">How It Works</Link>
            </nav>

            <div className="site-account">
                {isAuthenticated ? (
                    <>
                        <Link className="account-link" href="/profile">Profile</Link>
                        <SignOutButton />
                    </>
                ) : (
                    <GoogleSignInButton />
                )}
            </div>
        </header>
    );
}
