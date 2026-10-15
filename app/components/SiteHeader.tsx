import Link from "next/link";

import GoogleSignInButton from "./GoogleSignInButton";
import SignOutButton from "./SignOutButton";

type SiteHeaderProps = {
    isAuthenticated: boolean;
    currentPage: "tonight" | "archive";
};

export default function SiteHeader({
    isAuthenticated,
    currentPage,
}: SiteHeaderProps) {
    return (
        <>
            <header className="site-header">
                <Link className="site-brand" href="/" aria-label="NYC After Dark home">
                    <span className="site-brand-city" aria-hidden="true">N</span>
                    <span className="site-brand-name">NYC AFTER DARK<small>Night Notice Archive</small></span>
                </Link>

                <nav className="site-nav" aria-label="Main navigation">
                    <Link
                        href="/"
                        aria-current={currentPage === "tonight" ? "page" : undefined}
                    >
                        Live notice
                    </Link>
                    <Link
                        href="/past-nights"
                        aria-current={currentPage === "archive" ? "page" : undefined}
                    >
                        Archive
                    </Link>
                    <Link className="write-rule-link" href="/#submission-composer">
                        Submit guidance <span aria-hidden="true">↘</span>
                    </Link>
                </nav>

                <div className="site-account">
                    {isAuthenticated ? (
                        <>
                            <Link className="account-link" href="/profile">Account</Link>
                            <SignOutButton />
                        </>
                    ) : (
                        <GoogleSignInButton label="Sign in" />
                    )}
                </div>
            </header>

            <nav className="mobile-dock" aria-label="Mobile navigation">
                <Link
                    href="/"
                    aria-current={currentPage === "tonight" ? "page" : undefined}
                >
                    <span aria-hidden="true">01</span>
                    Live
                </Link>
                <Link href="/#submission-composer">
                    <span aria-hidden="true">+</span>
                    Submit
                </Link>
                <Link
                    href="/past-nights"
                    aria-current={currentPage === "archive" ? "page" : undefined}
                >
                    <span aria-hidden="true">07</span>
                    Archive
                </Link>
            </nav>
        </>
    );
}
