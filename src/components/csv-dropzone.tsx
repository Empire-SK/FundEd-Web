'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSVDropzoneProps {
    onFileSelect: (file: File) => void;
    isUploading?: boolean;
    className?: string;
}

export function CSVDropzone({ onFileSelect, isUploading = false, className }: CSVDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        const csvFile = files.find(file => file.name.endsWith('.csv'));

        if (csvFile) {
            setSelectedFile(csvFile);
            onFileSelect(csvFile);
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const clearFile = useCallback(() => {
        setSelectedFile(null);
    }, []);

    return (
        <div className={cn("w-full", className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative rounded-xl border-2 border-dashed transition-all duration-300",
                    isDragging
                        ? "border-emerald-500 bg-emerald-500/10 scale-[1.02]"
                        : "border-white/20 bg-white/5 hover:border-emerald-500/50 hover:bg-white/10",
                    isUploading && "opacity-50 pointer-events-none"
                )}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                    id="csv-upload"
                />

                <div className="p-8 text-center">
                    {selectedFile && !isUploading ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <div className="relative">
                                    <FileSpreadsheet className="h-16 w-16 text-emerald-400" />
                                    <CheckCircle2 className="absolute -top-2 -right-2 h-6 w-6 text-emerald-500 bg-black rounded-full" />
                                </div>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-white">{selectedFile.name}</p>
                                <p className="text-sm text-stone-400 mt-1">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    clearFile();
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Remove file
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
                                    <Upload className={cn(
                                        "h-12 w-12 transition-colors",
                                        isDragging ? "text-emerald-400" : "text-stone-400"
                                    )} />
                                </div>
                            </div>

                            <div>
                                <p className="text-lg font-medium text-white mb-2">
                                    {isDragging ? "Drop your CSV file here" : "Drag & drop CSV file"}
                                </p>
                                <p className="text-sm text-stone-400">
                                    or{' '}
                                    <label htmlFor="csv-upload" className="text-emerald-400 hover:text-emerald-300 cursor-pointer underline">
                                        browse files
                                    </label>
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs text-stone-500">
                                    CSV file should include: Name, Roll Number, Email, Phone (optional)
                                </p>
                            </div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                            <div className="text-center space-y-3">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
                                <p className="text-white font-medium">Uploading students...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">CSV Format Example:</p>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            // Create CSV content with proper format
                            const csvContent = `Name,Roll Number,Email,Class
John Doe,2024001,john@example.com,10A
Jane Smith,2024002,jane@example.com,10B
Mike Johnson,2024003,mike@example.com,10A
Sarah Williams,2024004,sarah@example.com,10C`;

                            // Create blob and download
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'students_template.csv';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Download Template
                    </button>
                </div>
                <div className="bg-black/40 rounded p-3 font-mono text-xs text-stone-300 overflow-x-auto">
                    <div>Name,Roll Number,Email,Class</div>
                    <div>John Doe,2024001,john@example.com,10A</div>
                    <div>Jane Smith,2024002,jane@example.com,10B</div>
                </div>
            </div>
        </div>
    );
}
