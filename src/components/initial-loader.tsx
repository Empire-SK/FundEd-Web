'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InitialLoader() {
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(true);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            setShow(false);
        }, 2000); // 2 seconds minimum display time

        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-700 ease-in-out",
                show ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            <div className="relative">
                {/* Pulsing Glow */}
                <div className="absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full animate-pulse-slow"></div>

                {/* Logo Container */}
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        {/* Spinner Ring */}
                        <div className="absolute inset-0 rounded-xl border-t-2 border-emerald-500 animate-spin"></div>

                        {/* Logo Icon */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 backdrop-blur-md flex items-center justify-center relative shadow-2xl shadow-emerald-500/20">
                            <GraduationCap className="w-12 h-12 text-emerald-400" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-200 to-stone-400 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            FundEd
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-emerald-500/80 font-medium tracking-widest uppercase animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Initializing Classroom OS
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Loading Bar */}
            <div className="absolute bottom-10 w-64 h-1 bg-stone-900 rounded-full overflow-hidden">
                <div className={cn(
                    "h-full bg-emerald-500 rounded-full transition-all duration-[2s] ease-out",
                    show ? "w-full" : "w-full"
                )}></div>
            </div>
        </div>
    );
}
