'use client';

import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageDropzoneProps {
    onFileSelect: (file: File) => void;
    className?: string;
    previewUrl?: string;
    onClear?: () => void;
}

export function ImageDropzone({ onFileSelect, className, previewUrl, onClear }: ImageDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));

        if (imageFile) {
            onFileSelect(imageFile);
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    return (
        <div className={cn("w-full", className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden",
                    isDragging
                        ? "border-emerald-500 bg-emerald-500/10 scale-[1.02]"
                        : "border-white/20 bg-white/5 hover:border-emerald-500/50 hover:bg-white/10",
                    previewUrl ? "border-emerald-500/50" : ""
                )}
            >
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="image-upload"
                    disabled={!!previewUrl}
                />

                <div className="p-8 text-center">
                    {previewUrl ? (
                        <div className="space-y-4 relative z-20">
                            <div className="relative mx-auto w-48 h-48 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                />
                                <div className="absolute top-2 right-2">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-black rounded-full" />
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onClear) onClear();
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Remove Image
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <div className={cn(
                                    "p-4 rounded-full transition-all duration-300",
                                    isDragging
                                        ? "bg-emerald-500/20 scale-110"
                                        : "bg-white/10"
                                )}>
                                    <Icons.Upload className={cn(
                                        "h-12 w-12 transition-colors",
                                        isDragging ? "text-emerald-400" : "text-stone-400"
                                    )} />
                                </div>
                            </div>

                            <div>
                                <p className="text-lg font-medium text-white mb-2">
                                    {isDragging ? "Drop your QR Code here" : "Drag & drop QR Code"}
                                </p>
                                <p className="text-sm text-stone-400">
                                    or{' '}
                                    <span className="text-emerald-400 hover:text-emerald-300 cursor-pointer underline">
                                        browse files
                                    </span>
                                </p>
                            </div>

                            <p className="text-xs text-stone-500">
                                Supports PNG, JPG, WebP (Max 2MB)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const Icons = {
    Upload: ({ className }: { className?: string }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    )
};
