"use client";

import React, { useEffect, useState } from 'react';
import { VisaConfig, ApplicationFormState, DocumentUploadState } from '@/types/visa';
import { applicationService } from '@/lib/services/applicationService';
import { documentService } from '@/lib/services/documentService';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ApplicationReviewProps {
    config: VisaConfig;
    onEditStep: (stepIndex: number) => void;
    applicationId?: string;
}

export function ApplicationReview({ config, onEditStep, applicationId }: ApplicationReviewProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [docsState, setDocsState] = useState<DocumentUploadState>({});

    useEffect(() => {
        async function loadData() {
            const app = await applicationService.getApplication(applicationId);
            if (app) setFormData(app.formData);

            const docs = await documentService.getDocuments(applicationId);
            if (docs) setDocsState(docs);
        }
        loadData();
    }, [applicationId]);

    const getMissingRequiredDocs = () => {
        return config.documentsRequired.filter(doc => doc.required && docsState[doc.id]?.status !== 'uploaded' && docsState[doc.id]?.status !== 'verified');
    };

    const missingDocs = getMissingRequiredDocs();

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Review Your Application</h2>
                <span className="px-3 py-1 bg-blue-50 text-[#C6A96A] rounded-md text-xs font-bold uppercase tracking-widest border border-blue-100">Draft</span>
            </div>

            {/* {config.processingTime && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                    <span className="text-xl mt-0.5">ℹ️</span>
                    <div>
                        <p className="font-semibold mb-1">Processing Information</p>
                        <p>{config.processingTime}</p>
                        <p className="mt-1">{config.fee}</p>
                    </div>
                </div>
            )} */}

            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-3 text-sm text-gray-700">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Terms &amp; Conditions Summary</h3>
                <p className="text-xs text-gray-500 mb-1">Please review carefully before submitting. By ticking the declaration checkboxes you confirm all of the following:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold text-xs mb-1">I hereby declare that:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>All information and documents provided in this application are true, complete and accurate.</li>
                            <li>I have sufficient funds to cover my travel and stay, and to support any accompanying family members.</li>
                            <li>I will comply with all conditions of entry and stay in the destination country and will leave the country before my visa expires.</li>
                            <li>I will present valid health and travel insurance for the duration of my stay, if required by the authorities.</li>
                            <li>I have disclosed any relevant medical or criminal history where applicable.</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-xs mb-1">I am aware that:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Submission of false or forged documents or information may lead to refusal of my visa.</li>
                            <li>Consular / VFS fees and GGBA professional service fees are strictly non‑refundable, regardless of the decision.</li>
                            <li>The Embassy / Consulate may request additional documents or call me for a personal interview.</li>
                            <li>My personal and biometric data may be collected and processed for visa issuance and verification.</li>
                            <li>Documents and information provided may be verified directly with issuing authorities or institutions.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-[#F6F8FB]/80 rounded-2xl p-6 md:p-8 border border-gray-100 shadow-inner space-y-8">
                {config.steps.slice(0, -1).map((step, index) => {
                    if (step.fields.length === 0) return null; // Skip documents step here

                    return (
                        <div key={step.id} className="relative group">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{step.title}</h3>
                                <button
                                    onClick={() => onEditStep(index)}
                                    className="text-xs font-semibold text-[#C6A96A] hover:text-amber-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    Edit Section
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                {step.fields
                                    .filter(field => field.type !== 'section-header')
                                    .map(field => (
                                        <div key={field.name} className={field.wrapperClassName}>
                                            <span className="text-gray-500 block mb-1 text-xs truncate" title={field.label}>{field.label}</span>
                                            <span className="font-semibold text-gray-900 text-base break-words">
                                                {formData[field.name] ? String(formData[field.name]) : <span className="text-gray-400 italic">Not provided</span>}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    );
                })}

                {/* Document Status Summary */}
                <div className="relative group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Documents Status</h3>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        {missingDocs.length > 0 ? (
                            <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Missing Required Documents ({missingDocs.length})</p>
                                    <ul className="list-disc list-inside mt-1 text-xs text-amber-700/80">
                                        {missingDocs.map(d => <li key={d.id} className="truncate">{d.name}</li>)}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                <CheckCircle2 className="w-5 h-5" />
                                All required documents are uploaded.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
