'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const cursorRingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Performance check: Don't run on mobile
        if (window.matchMedia('(hover: none)').matches || window.innerWidth < 768) {
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            // Direct DOM manipulation for high-performance custom cursor
            if (cursorRef.current && cursorRingRef.current) {
                // Instant follow for dot
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

                // Smooth follow for ring
                cursorRingRef.current.animate({
                    transform: `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
                }, {
                    duration: 300,
                    fill: "forwards"
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="hidden md:block">
            {/* Custom Cursor Dot - Smaller and more subtle */}
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-2 h-2 bg-emerald-400/80 rounded-full pointer-events-none z-[9999] mix-blend-screen -translate-x-1/2 -translate-y-1/2"
            />

            {/* Custom Cursor Ring - Larger with smooth follow */}
            <div
                ref={cursorRingRef}
                className="fixed top-0 left-0 w-10 h-10 rounded-full border border-emerald-500/40 pointer-events-none z-[9998] transition-all duration-200 ease-out -translate-x-1/2 -translate-y-1/2 opacity-60"
            />
        </div>
    );
}
