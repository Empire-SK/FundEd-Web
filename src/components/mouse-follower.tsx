'use client';

import { useEffect, useRef } from 'react';

export function MouseFollower() {
    const blobRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!blobRef.current) return;

            const { clientX, clientY } = e;

            // Direct DOM manipulation guarantees 60fps without React re-renders
            blobRef.current.animate({
                transform: `translate(${clientX - 250}px, ${clientY - 250}px)`
            }, {
                duration: 2000, // Slower duration for smoother lag effect
                fill: "forwards",
                easing: "ease-out"
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div
            ref={blobRef}
            className="fixed w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[80px] pointer-events-none mix-blend-screen z-[5] will-change-transform"
            style={{
                top: 0,
                left: 0,
                // Initial position off-screen or safe default
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
}
