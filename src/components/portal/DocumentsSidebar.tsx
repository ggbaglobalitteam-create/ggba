"use client";

import React, { useState, useEffect } from 'react';
import { DocumentItem, DocumentUploadState } from '@/types/visa';
import { documentService } from '@/lib/services/documentService';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface DocumentsSidebarProps {
    documentsRequired: DocumentItem[];
    applicationId?: string;
}

export function DocumentsSidebar({ documentsRequired, applicationId }: DocumentsSidebarProps) {
    const [docsState, setDocsState] = useState<DocumentUploadState>({});
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    useEffect(() => {
        async function loadDocs() {
            const state = await documentService.getDocuments(applicationId);
            if (state) setDocsState(state);
        }
        loadDocs();
    }, [applicationId]);

    const handleFileUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingId(docId);
        try {
            const newDoc = await documentService.uploadDocument(docId, {
                fileName: file.name,
                fileSize: file.size,
                file,
            }, applicationId);
            setDocsState(prev => ({ ...prev, [docId]: newDoc }));
        } catch (error) {
            console.error('Failed to upload document', { docId, error });
        } finally {
            setUploadingId(null);
            e.target.value = '';
        }
    };

    if (!documentsRequired || documentsRequired.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Required Documents</h3>
                <span className="text-sm font-medium text-[#C6A96A]">
                    {Object.values(docsState).filter(d => d.status === 'uploaded' || d.status === 'verified').length} / {documentsRequired.length}
                </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {documentsRequired.map(doc => {
                    const status = docsState[doc.id]?.status || 'pending';
                    const fileName = docsState[doc.id]?.fileName;

                    return (
                        <div key={doc.id} className={`p-4 rounded-xl border transition-all ${status === 'uploaded' ? 'border-blue-200 bg-blue-50/30' : status === 'verified' ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {status === 'pending' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                                        {status === 'uploaded' && <Clock className="w-4 h-4 text-blue-500" />}
                                        {status === 'verified' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        <h4 className="font-medium text-sm text-gray-900">{doc.name}</h4>
                                    </div>
                                    {(doc.apostilleRequired || doc.notarizationRequired || doc.notes) && (
                                        <div className="text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded-md mt-1">
                                            {doc.apostilleRequired && 'Apostille Required '}
                                            {doc.notarizationRequired && 'Notarization Required '}
                                            {doc.notes}
                                        </div>
                                    )}
                                    {fileName && status === 'uploaded' && (
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]" title={fileName}>{fileName}</p>
                                    )}
                                </div>

                                {status === 'pending' && (
                                    <div className="flex-shrink-0">
                                        <label
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex cursor-pointer ${
                                                uploadingId === doc.id ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-[#C6A96A] bg-blue-50 hover:bg-blue-100'
                                            }`}
                                        >
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(doc.id, e)}
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                disabled={uploadingId === doc.id}
                                            />
                                            {uploadingId === doc.id ? 'Uploading...' : 'Upload'}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="pt-3 text-xs text-gray-500">
                <span className="font-semibold">Note:</span> Max file size 5MB. PDF, JPG, PNG only.
            </div>
        </div>
    );
}
