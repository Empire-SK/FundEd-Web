'use client';

import { useEffect, useState } from 'react';

export function MouseFollower() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div
            className="fixed w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[80px] pointer-events-none transition-transform duration-200 ease-out mix-blend-screen z-[5]"
            style={{
                top: 0,
                left: 0,
                transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`
            }}
        />
    );
}
