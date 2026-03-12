"use client";

import React, { useEffect, useState } from 'react';
import { FileUpload } from '@/components/portal/FileUpload';
import { Button } from '@/components/portal/Button';
import { AlertCircle, ChevronDown, ChevronUp, File as FileIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VisaConfig, ApplicationFormState, DocumentUploadState } from '@/types/visa';
import { visaConfigService } from '@/lib/services/visaConfigService';
import { applicationService } from '@/lib/services/applicationService';
import { documentService } from '@/lib/services/documentService';
import { getPostDocumentsRoute, resolveFlow } from '@/lib/applicationFlow';

type ApplicationListItem = {
    id: string;
    destinationCountry?: string | null;
    purpose?: string | null;
    createdAt?: string;
    formData?: Record<string, unknown> | null;
};

const SUBMITTED_AT_KEY = '__submittedAt';

export default function UploadDocumentsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

    const [visaConfig, setVisaConfig] = useState<VisaConfig | null>(null);
    const [formState, setFormState] = useState<ApplicationFormState | null>(null);
    const [docsState, setDocsState] = useState<DocumentUploadState>({});
    const [gatewayState, setGatewayState] = useState<{ destinationCountry?: string; purpose?: string } | null>(null);

    useEffect(() => {
        async function loadData() {
            const list = await applicationService.listApplications();
            setApplications(list);
            if (!list.length) {
                router.push('/portal/applicant/application-form');
                return;
            }

            const currentId = applicationService.getCurrentApplicationId();
            const selected =
                (currentId && list.some((item) => item.id === currentId) ? currentId : null) ||
                list[0].id;
            setSelectedApplicationId(selected);
            applicationService.setCurrentApplicationId(selected);
        }

        void loadData();
    }, [router]);

    useEffect(() => {
        async function loadSelectedData() {
            if (!selectedApplicationId) return;

            setIsLoading(true);
            const config = await visaConfigService.getById(selectedApplicationId);
            if (!config) {
                setVisaConfig(null);
                setFormState(null);
                setDocsState({});
                setGatewayState(null);
                setIsLoading(false);
                return;
            }
            setVisaConfig(config);
            const flow = resolveFlow(config);
            if (!flow.requiresDocuments) {
                router.push(getPostDocumentsRoute(config));
                return;
            }

            const form = await applicationService.getApplication(selectedApplicationId);
            if (form) setFormState(form);

            const docs = await documentService.getDocuments(selectedApplicationId);
            if (docs) setDocsState(docs);

            const gateway = await applicationService.getGatewayState(selectedApplicationId);
            setGatewayState(gateway);

            applicationService.setCurrentApplicationId(selectedApplicationId);
            setIsLoading(false);
        }

        void loadSelectedData();
    }, [router, selectedApplicationId]);

    const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFileSelect = async (docId: string, file: File) => {
        if (!selectedApplicationId) return;
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
            }, selectedApplicationId);
            setDocsState(prev => ({ ...prev, [docId]: newDoc as any }));
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
        if (!selectedApplicationId) return;
        await documentService.removeDocument(docId, selectedApplicationId);
        setDocsState(prev => {
            const next = { ...prev };
            delete next[docId];
            return next;
        });
    };

    if (isLoading || !visaConfig) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div></div>;

    const selectedApplication = applications.find((item) => item.id === selectedApplicationId) || null;
    const isSubmittedSelected = Boolean(
        selectedApplication?.formData &&
        typeof selectedApplication.formData === 'object' &&
        typeof selectedApplication.formData[SUBMITTED_AT_KEY] === 'string'
    );

    const uploadedCount = visaConfig.documentsRequired.filter(d => docsState[d.id]?.status === 'uploaded' || docsState[d.id]?.status === 'verified').length;
    const allRequiredUploaded = visaConfig.documentsRequired.every(d => !d.required || docsState[d.id]?.status === 'uploaded' || docsState[d.id]?.status === 'verified');
    const nextRoute = getPostDocumentsRoute(visaConfig);
    const nextLabel = nextRoute.includes('/payment') ? 'Proceed to Payment'
        : nextRoute.includes('/booking') ? 'Proceed to Appointment'
            : 'Proceed to Status';

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Document Upload</h1>
                    <p className="text-gray-500">Provide clear and legible scans of the required documents.</p>
                    {applications.length > 1 && (
                        <div className="mt-4 max-w-sm">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Application</label>
                            <select
                                value={selectedApplicationId || ''}
                                onChange={(e) => setSelectedApplicationId(e.target.value)}
                                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                                {applications.map((app) => {
                                    const submitted = Boolean(
                                        app.formData &&
                                        typeof app.formData === 'object' &&
                                        typeof app.formData[SUBMITTED_AT_KEY] === 'string'
                                    );
                                    return (
                                        <option key={app.id} value={app.id}>
                                            {app.destinationCountry || '-'} - {app.purpose || '-'} {submitted ? '(Submitted)' : '(Draft)'}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-sm font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Progress</span>
                    <span className="text-2xl font-bold text-[#C6A96A]">{uploadedCount} <span className="text-gray-400 text-lg">/ {visaConfig.documentsRequired.length}</span></span>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 text-sm text-blue-900 shadow-sm ring-1 ring-blue-900/5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1">Upload Guidelines</p>
                    <p className="opacity-80">Finalize your application by uploading all required documents. Use <span className="font-bold">PDF, JPG, or PNG</span> (max <span className="font-bold">5MB</span>). Ensure every corner is visible and text is sharp. <span className="font-bold text-rose-600 block sm:inline mt-1 sm:mt-0">Mobile scans will be Rejected.</span></p>
                    <p className="mt-2 text-xs font-semibold text-blue-900/80">
                        Viewing documents for application ID: {selectedApplicationId}
                        {isSubmittedSelected ? ' (Submitted)' : ' (Draft)'}
                    </p>
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
                            <span className="text-xs text-gray-500">Quick check for {String(formState?.formData.firstName || '')}&apos;s submission</span>
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
                                <span className="font-medium text-gray-900 break-words">{String(formState.formData.firstName || '')} {String(formState.formData.lastName || '')}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold">Passport</span>
                                <span className="font-medium text-gray-900">{String(formState.formData.passportNumber || 'N/A')}</span>
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

                    const mainLabel = doc.name;
                    const infoLabel = doc.infoLabel || "";

                    return (
                        <div key={doc.id} className="space-y-3">
                            <FileUpload
                                label={mainLabel}
                                infoLabel={infoLabel}
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

            {/* Others Section */}
            {Object.entries(docsState).some(([id]) => !visaConfig.documentsRequired.some(d => d.id === id)) && (
                <div className="pt-8 border-t border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Other Documents</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(docsState)
                            .filter(([id]) => !visaConfig.documentsRequired.some(d => d.id === id))
                            .map(([id, docState]) => (
                                <div key={id} className="space-y-3">
                                    <FileUpload
                                        label={docState.fileName || 'Other Document'}
                                        required={false}
                                        file={{
                                            name: docState.fileName || 'document',
                                            size: docState.fileSize || 0,
                                            dataUrl: docState.dataUrl
                                        }}
                                        isUploading={false}
                                        onRemove={() => handleRemove(id)}
                                    />
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-6">
                <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold text-gray-900">Uploading as {String(formState?.formData.firstName || '')}</p>
                    <p className="text-xs text-gray-500">Contact support if you need to change application details.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                    <Button variant="outline" className="flex-1 sm:flex-none px-8" onClick={() => router.push('/portal/applicant/application-form')}>Back</Button>
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
