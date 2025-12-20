'use client';

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface PageLoaderProps {
    message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center">
            <div className="relative">
                {/* Spinning ring */}
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>

                {/* Icon in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-emerald-500 animate-pulse" />
                </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground font-medium">
                {message}{dots}
            </p>
        </div>
    );
}

export function FullPageLoader({ message = 'Loading...' }: PageLoaderProps) {
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>

                {/* Spinning ring */}
                <div className="relative w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>

                {/* Icon in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="h-10 w-10 text-emerald-500 animate-pulse" />
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-lg font-semibold text-white mb-2">FundEd</p>
                <p className="text-sm text-stone-400">{message}</p>
            </div>
        </div>
    );
}

export function TableLoader({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg"></div>
            ))}
        </div>
    );
}

export function CardLoader() {
    return (
        <div className="animate-pulse">
            <div className="h-32 bg-muted/50 rounded-lg"></div>
        </div>
    );
}
