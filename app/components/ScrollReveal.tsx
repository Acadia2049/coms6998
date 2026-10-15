"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollRevealProps = {
    children: ReactNode;
    className?: string;
};

export default function ScrollReveal({ children, className = "" }: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const revealRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = revealRef.current;

        if (!element || !("IntersectionObserver" in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "0px 0px -12%", threshold: 0.08 }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={revealRef}
            className={`scroll-reveal${isVisible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
        >
            {children}
        </div>
    );
}
