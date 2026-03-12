"use client";

import React, { useState } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle2, Loader2, Image as ImageIcon, Info } from 'lucide-react';

interface FileInfo {
    name: string;
    size: number;
    dataUrl?: string;
    type?: string;
}

interface FileUploadProps {
    label: string;
    infoLabel?: string;
    accept?: string;
    onFileSelect?: (file: File) => void;
    onRemove?: () => void;
    required?: boolean;
    file?: FileInfo | null;
    isUploading?: boolean;
    error?: string;
}

export function FileUpload({ label, infoLabel, accept = ".pdf,.jpg,.jpeg,.png", onFileSelect, onRemove, required, file, isUploading, error }: FileUploadProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect?.(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect?.(e.target.files[0]);
        }
    };

    const isImage = (fileName: string) => /\.(jpg|jpeg|png)$/i.test(fileName);
    const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1.5">
                <div className="relative flex items-center gap-1.5">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        {label} {required && <span className="text-rose-500">*</span>}
                    </label>
                    {infoLabel && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setShowInfo(!showInfo); }}
                            className="text-gray-400 hover:text-[#C6A96A] transition-colors focus:outline-none flex-shrink-0"
                            title="More Information"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {error && <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">{error}</span>}
            </div>

            {showInfo && infoLabel && (
                <div className="mb-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs leading-relaxed text-blue-800 animate-in fade-in slide-in-from-top-1 shadow-sm">
                    {infoLabel}
                </div>
            )}

            {!file ? (
                <label
                    className={`
            relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer
            transition-all duration-300 group
            ${isDragActive ? 'border-[#C6A96A] bg-amber-50/30 scale-[1.01]' : 'border-gray-200 bg-[#F6F8FB] hover:bg-gray-50 hover:border-gray-300'}
            ${isUploading ? 'pointer-events-none opacity-70' : ''}
          `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center text-center px-4">
                        {isUploading ? (
                            <>
                                <Loader2 className="w-8 h-8 mb-2 text-[#C6A96A] animate-spin" />
                                <p className="text-sm font-medium text-gray-600">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <div className="p-2.5 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform mb-3">
                                    <UploadCloud className={`w-6 h-6 ${isDragActive ? 'text-[#C6A96A]' : 'text-gray-400'}`} />
                                </div>
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-[#C6A96A] hover:underline">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight font-medium">PDF, JPG, PNG (Max 5MB)</p>
                            </>
                        )}
                    </div>
                    {!isUploading && <input type="file" className="hidden" accept={accept} onChange={handleChange} />}
                </label>
            ) : (
                <div className="flex items-center p-3.5 bg-white border border-gray-100 rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] ring-1 ring-gray-900/[0.02] animate-in zoom-in-95 duration-200">
                    <div className="p-2.5 bg-blue-50/50 rounded-lg mr-4 flex-shrink-0 text-[#C6A96A]">
                        {isImage(file.name) ? (
                            file.dataUrl ? (
                                <div className="w-8 h-8 rounded overflow-hidden" style={{ backgroundImage: `url(${file.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            ) : (
                                <ImageIcon className="w-6 h-6" />
                            )
                        ) : (
                            <FileIcon className="w-6 h-6" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400 font-medium">{formatSize(file.size)}</p>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <span className="text-[10px] text-emerald-600 flex items-center font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> UPLOADED
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-2 ml-4 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-all transform hover:rotate-90"
                        title="Remove file"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
