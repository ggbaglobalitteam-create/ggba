"use client";

import React, { useEffect, useState } from 'react';
import { FileUpload } from '@/components/portal/FileUpload';
import { Button } from '@/components/portal/Button';
import { AlertCircle, ChevronDown, ChevronUp, File as FileIcon, ChevronRight, Briefcase, Users, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VisaConfig, ApplicationFormState, DocumentUploadState } from '@/types/visa';
import { visaConfigService } from '@/lib/services/visaConfigService';
import { applicationService } from '@/lib/services/applicationService';
import { documentService } from '@/lib/services/documentService';
import { getPostDocumentsRoute, toAgentRoute } from '@/lib/applicationFlow';

type ApplicationDetailLite = {
    agent?: {
        user?: {
            firstName?: string | null;
            lastName?: string | null;
            email?: string | null;
        } | null;
    } | null;
};

type GatewayStateLite = {
    destinationCountry?: string;
    purpose?: string;
};

export default function AgentUploadDocumentsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const applicantId = params.id;
    const [isLoading, setIsLoading] = useState(true);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const [visaConfig, setVisaConfig] = useState<VisaConfig | null>(null);
    const [formState, setFormState] = useState<ApplicationFormState | null>(null);
    const [docsState, setDocsState] = useState<DocumentUploadState>({});
    const [gatewayState, setGatewayState] = useState<GatewayStateLite | null>(null);
    const [applicationDetail, setApplicationDetail] = useState<ApplicationDetailLite | null>(null);

    useEffect(() => {
        async function loadData() {
            // 1. Get Visa Config (Resilient now via service fix)
            const config = await visaConfigService.getById(applicantId);
            if (!config) {
                router.push('/portal/agent/applicants');
                return;
            }
            setVisaConfig(config);

            // 2. Load data from real API
            const form = await applicationService.getApplication(applicantId);
            const gateway = await applicationService.getGatewayState(applicantId);

            if (form) setFormState(form);
            if (gateway) setGatewayState(gateway);

            const docs = await documentService.getDocuments(applicantId);
            if (docs) setDocsState(docs);

            const detailRes = await fetch(`/api/applications/${encodeURIComponent(applicantId)}`);
            const detail = await detailRes.json().catch(() => null);
            if (detailRes.ok) setApplicationDetail(detail);

            setIsLoading(false);
        }

        loadData();
    }, [router, applicantId]);

    const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFileSelect = async (docId: string, file: File) => {
        // Validation
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, [docId]: 'Max 5MB' }));
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setErrors(prev => ({ ...prev, [docId]: 'Invalid type' }));
            return;
        }

        setErrors(prev => ({ ...prev, [docId]: '' }));
        setUploadingIds(prev => new Set(prev).add(docId));

        try {
            const newDoc = await documentService.uploadDocument(docId, {
                fileName: file.name,
                fileSize: file.size,
                file,
            }, applicantId);
            setDocsState(prev => ({ ...prev, [docId]: newDoc }));
        } catch (e) {
            console.error(e);
            setErrors(prev => ({ ...prev, [docId]: 'Upload failed' }));
        } finally {
            setUploadingIds(prev => {
                const next = new Set(prev);
                next.delete(docId);
                return next;
            });
        }
    };

    const handleRemove = async (docId: string) => {
        await documentService.removeDocument(docId, applicantId);
        setDocsState(prev => {
            const next = { ...prev };
            delete next[docId];
            return next;
        });
    };

    if (isLoading || !visaConfig) return <div className="min-h-screen flex items-center justify-center font-medium text-gray-400">Loading Client Data...</div>;

    const uploadedCount = Object.values(docsState).filter(d => d.status === 'uploaded' || d.status === 'verified').length;
    const allRequiredUploaded = visaConfig.documentsRequired.every(d => !d.required || docsState[d.id]?.status === 'uploaded' || docsState[d.id]?.status === 'verified');
    const nextRoute = toAgentRoute(getPostDocumentsRoute(visaConfig), applicantId);
    const nextLabel = nextRoute.includes('/payment')
        ? 'Proceed to Payment'
        : nextRoute.includes('/booking')
            ? 'Proceed to Appointment'
            : 'Complete Submission';
    const assignedAgentName = `${applicationDetail?.agent?.user?.firstName || ''} ${applicationDetail?.agent?.user?.lastName || ''}`.trim()
        || applicationDetail?.agent?.user?.email
        || 'Assigned Agent';

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                <Link href="/portal/agent/upload-documents" className="hover:text-[#C6A96A] transition-colors flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    Document Management
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="text-gray-900 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    {formState?.formData.firstName || 'Client'} {formState?.formData.lastName || 'Upload'}
                </span>
            </nav>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C6A96A]"></div>
                <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100 uppercase tracking-widest flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3" /> {applicantId}
                        </span>
                        <span className="px-2.5 py-1 bg-[#C6A96A]/10 text-[#C6A96A] text-[10px] font-bold rounded-lg border border-[#C6A96A]/10 uppercase tracking-widest">
                            {gatewayState?.purpose}
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                        {formState?.formData.firstName} {formState?.formData.lastName}
                    </h1>
                    <p className="text-gray-500 font-medium flex items-center gap-2">
                        Managing documents for <span className="text-gray-900 font-bold underline decoration-[#C6A96A]/30 underline-offset-4">{gatewayState?.destinationCountry}</span>
                    </p>
                </div>
                <div className="flex flex-col items-end gap-4 shrink-0 w-full md:w-auto">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-[0.2em]">Upload Progress</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-[#C6A96A]">{uploadedCount}</span>
                            <span className="text-gray-400 font-bold text-lg">/ {visaConfig.documentsRequired.length}</span>
                        </div>
                    </div>
                    <Link href="/portal/agent/upload-documents" className="w-full md:w-auto">
                        <Button variant="outline" size="sm" className="w-full md:w-auto flex items-center gap-2 font-bold text-xs uppercase tracking-widest border-gray-100 bg-gray-50/50 hover:bg-white transition-all">
                            <RefreshCcw className="w-3.5 h-3.5" /> Switch Client
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 text-sm text-blue-900 shadow-sm ring-1 ring-blue-900/5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1 tracking-tight">Multi-Application Mode</p>
                    <p className="opacity-80 leading-relaxed">You are viewing documents specifically for <span className="font-bold underline">ID: {applicantId}</span>. Changes here will not affect other client sessions.</p>
                </div>
            </div>


            {/* Application Summary Collapsible */}
            <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300">
                <button
                    onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors focus:outline-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#F6F8FB] rounded-lg">
                            <FileIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-gray-900">Application Summary Preview</span>
                            <span className="text-xs text-gray-500">Quick check for {formState?.formData.firstName}&apos;s submission</span>
                        </div>
                    </div>
                    {isSummaryOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>
                {isSummaryOpen && formState && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-50 bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold">Applicant</span>
                                <span className="font-medium text-gray-900 break-words">{formState.formData.firstName} {formState.formData.lastName}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold">Passport</span>
                                <span className="font-medium text-gray-900">{formState.formData.passportNumber || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold">Destination</span>
                                <span className="font-medium text-gray-900">{gatewayState?.destinationCountry || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold">Visa Type</span>
                                <span className="font-medium text-gray-900">{gatewayState?.purpose || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visaConfig.documentsRequired.map(doc => {
                    const docState = docsState[doc.id];

                    return (
                        <div key={doc.id} className="space-y-3">
                            <FileUpload
                                label={doc.name}
                                required={doc.required}
                                file={docState ? {
                                    name: docState.fileName || 'document',
                                    size: docState.fileSize || 0,
                                    dataUrl: docState.dataUrl
                                } : null}
                                isUploading={uploadingIds.has(doc.id)}
                                onFileSelect={(file) => handleFileSelect(doc.id, file)}
                                onRemove={() => handleRemove(doc.id)}
                                error={errors[doc.id]}
                            />

                            {(doc.apostilleRequired || doc.notarizationRequired || doc.notes) && (
                                <div className="flex flex-wrap gap-2">
                                    {doc.apostilleRequired && (
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">Apostille</span>
                                    )}
                                    {doc.notarizationRequired && (
                                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">Notarized</span>
                                    )}
                                    {doc.notes && (
                                        <p className="text-xs text-gray-400 italic">*{doc.notes}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-6">
                <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold text-gray-900">Agent Handling: {assignedAgentName}</p>
                    <p className="text-xs text-gray-500">Documents will be queued for verification.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                    <Button variant="outline" className="flex-1 sm:flex-none px-8" onClick={() => router.push('/portal/agent/applicants/new')}>Back</Button>
                    <Button
                        onClick={() => router.push(nextRoute)}
                        className={`flex-1 sm:flex-none px-10 shadow-lg shadow-[#C6A96A]/20 transition-all ${!allRequiredUploaded ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#C6A96A]/30'}`}
                        disabled={!allRequiredUploaded}
                    >
                        {nextLabel}
                    </Button>
                </div>
            </div>

            {!allRequiredUploaded && (
                <div className="flex justify-center sm:justify-end">
                    <p className="text-xs font-semibold text-rose-500 animate-pulse bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                        {visaConfig.documentsRequired.filter(d => d.required && !docsState[d.id]).length} required documents remaining
                    </p>
                </div>
            )}
        </div>
    );
}
