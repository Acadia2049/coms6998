import Link from "next/link";

import GoogleSignInButton from "./GoogleSignInButton";
import SignOutButton from "./SignOutButton";

type SiteHeaderProps = {
    isAuthenticated: boolean;
    currentPage: "tonight" | "archive" | "write";
};

export default function SiteHeader({
    isAuthenticated,
    currentPage,
}: SiteHeaderProps) {
    return (
        <>
            <header className="site-header">
                <Link className="site-brand" href="/" aria-label="NYC After Dark home">
                    <span className="site-brand-city" aria-hidden="true">NYC</span>
                    <span className="site-brand-name">AFTER DARK</span>
                </Link>

                <nav className="site-nav" aria-label="Main navigation">
                    <Link
                        href="/"
                        aria-current={currentPage === "tonight" ? "page" : undefined}
                    >
                        Tonight
                    </Link>
                    <Link
                        href="/past-nights"
                        aria-current={currentPage === "archive" ? "page" : undefined}
                    >
                        Past Nights
                    </Link>
                    <Link
                        className="write-rule-link"
                        href="/write"
                        aria-current={currentPage === "write" ? "page" : undefined}
                    >
                        Write a Rule
                    </Link>
                </nav>

                <div className="site-account">
                    {isAuthenticated ? (
                        <>
                            <Link className="account-link" href="/profile">Account</Link>
                            <SignOutButton />
                        </>
                    ) : (
                        <GoogleSignInButton
                            label="Sign in"
                            returnTo={currentPage === "write" ? "/write" : "/"}
                        />
                    )}
                </div>
            </header>

            <nav className="mobile-dock" aria-label="Mobile navigation">
                <Link
                    href="/"
                    aria-current={currentPage === "tonight" ? "page" : undefined}
                >
                    <span aria-hidden="true">01</span>
                    Tonight
                </Link>
                <Link
                    href="/write"
                    aria-current={currentPage === "write" ? "page" : undefined}
                >
                    <span aria-hidden="true">+</span>
                    Write
                </Link>
                <Link
                    href="/past-nights"
                    aria-current={currentPage === "archive" ? "page" : undefined}
                >
                    <span aria-hidden="true">07</span>
                    Past
                </Link>
            </nav>
        </>
    );
}
