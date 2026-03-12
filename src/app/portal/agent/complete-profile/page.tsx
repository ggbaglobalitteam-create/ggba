"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentService, AgentProfile, readAgentProfileDraftForIds, writeAgentProfileDraftForIds } from '@/lib/services/agentService';
import { useSession } from 'next-auth/react';
import { UploadCloud, ExternalLink } from 'lucide-react';

type AgentDocumentType = 'BUSINESS_REGISTRATION' | 'TAX_PAN' | 'IDENTITY_DOCUMENT';

type AgentDocumentItem = {
    id: string;
    type: AgentDocumentType;
    fileName: string;
    fileUrl: string;
    status: string;
};

function canReplaceAgentDoc(status?: string) {
    return !status || String(status).toUpperCase() === 'REJECTED';
}

function hasSavedValue(value?: string | null) {
    return Boolean(value && value.trim());
}

export default function CompleteProfilePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);

    // Agent Specific Fields
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [businessReg, setBusinessReg] = useState('');
    const [taxId, setTaxId] = useState('');
    const [directorId, setDirectorId] = useState('');
    const [agentDocs, setAgentDocs] = useState<AgentDocumentItem[]>([]);
    const [uploadingType, setUploadingType] = useState<AgentDocumentType | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (status === 'loading') return;
            const userId = (session?.user as { id?: string } | undefined)?.id;
            if (!userId) {
                router.push('/portal/login');
                return;
            }

            const current = await agentService.getAgent(userId);
            if (!current) {
                alert('Agent profile not found. Please contact support.');
                router.push('/portal/login');
                return;
            }

            setAgentProfile(current);
            const draft = readAgentProfileDraftForIds(current.id, current.userId);
            setCompanyName(current.companyName || draft?.companyName || '');
            setAddress(current.address || draft?.address || '');
            setBusinessReg(current.businessRegistrationNo || draft?.businessRegistrationNo || '');
            setTaxId(current.taxId || draft?.taxId || '');
            setDirectorId(current.directorId || draft?.directorId || '');
            setIsSubmitted(
                current.isProfileComplete ||
                current.status === 'pending' ||
                current.status === 'approved' ||
                Boolean(draft?.submitted)
            );

            const docsRes = await fetch(`/api/agents/${encodeURIComponent(current.id)}/documents`);
            const docsData = await docsRes.json().catch(() => ({}));
            const docs = Array.isArray(docsData?.items) ? docsData.items : [];
            setAgentDocs(docs);

            const hasRequiredDocs =
                docs.some((doc: AgentDocumentItem) => doc.type === 'BUSINESS_REGISTRATION') &&
                docs.some((doc: AgentDocumentItem) => doc.type === 'TAX_PAN') &&
                docs.some((doc: AgentDocumentItem) => doc.type === 'IDENTITY_DOCUMENT');

            const hasRequiredTextFields =
                hasSavedValue(current.companyName || draft?.companyName) &&
                hasSavedValue(current.address || draft?.address) &&
                hasSavedValue(current.businessRegistrationNo || draft?.businessRegistrationNo) &&
                hasSavedValue(current.taxId || draft?.taxId) &&
                hasSavedValue(current.directorId || draft?.directorId);

            if (hasRequiredDocs || hasRequiredTextFields || current.status === 'pending' || current.status === 'approved') {
                setIsSubmitted(true);
            }
        };
        loadProfile();
    }, [router, session, status]);

    useEffect(() => {
        if (!agentProfile) return;
        writeAgentProfileDraftForIds({
            companyName,
            address,
            businessRegistrationNo: businessReg,
            taxId,
            directorId,
            submitted: isSubmitted,
        }, agentProfile.id, agentProfile.userId);
    }, [agentProfile, companyName, address, businessReg, taxId, directorId, isSubmitted]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentProfile) return;

        setIsLoading(true);

        try {
            writeAgentProfileDraftForIds({
                companyName,
                address,
                businessRegistrationNo: businessReg,
                taxId,
                directorId,
                submitted: true,
            }, agentProfile.id, agentProfile.userId);
            setIsSubmitted(true);

            const updated = await agentService.completeProfile(agentProfile.id, {
                companyName,
                address,
                businessRegistrationNo: businessReg,
                taxId: taxId,
                directorId: directorId
            });
            if (updated) {
                setAgentProfile(updated);
                setIsSubmitted(updated.isProfileComplete || updated.status === 'pending' || updated.status === 'approved');
                writeAgentProfileDraftForIds({
                    companyName,
                    address,
                    businessRegistrationNo: businessReg,
                    taxId,
                    directorId,
                    submitted: true,
                }, updated.id, updated.userId);
            }

            setTimeout(() => {
                setIsLoading(false);
            }, 800);
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
            setIsLoading(false);
        }
    };

    const uploadAgentDocument = async (type: AgentDocumentType, label: string, file: File) => {
        if (!agentProfile) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('File exceeds 5MB limit.');
            return;
        }
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (file.type && !allowed.includes(file.type)) {
            alert('Allowed file types: PDF, JPG, JPEG, PNG.');
            return;
        }

        setUploadingType(type);
        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('label', label);
            formData.append('file', file);

            const res = await fetch(`/api/agents/${encodeURIComponent(agentProfile.id)}/documents`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Upload failed');

            setAgentDocs((prev) => {
                const filtered = prev.filter((doc) => doc.type !== type);
                return [...filtered, data as AgentDocumentItem];
            });
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            alert(message);
        } finally {
            setUploadingType(null);
        }
    };

    const getDocByType = (type: AgentDocumentType) => agentDocs.find((doc) => doc.type === type);

    if (!agentProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6A96A]"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[600px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 my-8 mt-12">
            <div className="mb-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                {/* Internal Branding */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0F1B2D] rounded-xl flex items-center justify-center shadow-md">
                        <img src="/images/logo.png" alt="GGBA" className="h-[24px] w-auto brightness-0 invert" />
                    </div>
                    <span className="text-lg font-black text-[#0F1B2D] tracking-tighter leading-none uppercase">GGBA GLOBAL</span>
                </div>

                <h1 className="text-[32px] sm:text-[38px] font-bold text-[#1C2430] mb-3 tracking-tight leading-none">Complete Profile</h1>
                <p className="text-[#6B7280] text-[15px] sm:text-base">
                    {isSubmitted
                        ? 'Your agency details are already on file and under review.'
                        : 'Please provide your agency details to submit your profile for approval.'}
                </p>
            </div>

            {isSubmitted && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Your profile has already been submitted. The saved details remain editable here until the review outcome changes.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[13px] font-semibold text-[#1C2430] block">
                            Company Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter Company Name"
                            className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[13px] font-semibold text-[#1C2430] block">
                            Full Company Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter Full Address"
                            className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#1C2430] block">
                            Business Registration No. <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={businessReg}
                            onChange={(e) => setBusinessReg(e.target.value)}
                            placeholder="Registration No."
                            className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                            required
                        />
                        <div className="flex items-center gap-3 pt-1">
                            <label className={`text-xs font-semibold inline-flex items-center gap-1.5 ${canReplaceAgentDoc(getDocByType('BUSINESS_REGISTRATION')?.status) ? 'text-[#C6A96A] hover:text-[#B8954F] cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                                <UploadCloud className="w-3.5 h-3.5" />
                                {uploadingType === 'BUSINESS_REGISTRATION'
                                    ? 'Uploading...'
                                    : getDocByType('BUSINESS_REGISTRATION')
                                        ? (canReplaceAgentDoc(getDocByType('BUSINESS_REGISTRATION')?.status) ? 'Upload revised proof' : 'Proof locked')
                                        : 'Upload proof'}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={uploadingType !== null || !canReplaceAgentDoc(getDocByType('BUSINESS_REGISTRATION')?.status)}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadAgentDocument('BUSINESS_REGISTRATION', 'Business Registration Proof', file);
                                        e.currentTarget.value = '';
                                    }}
                                />
                            </label>
                            {getDocByType('BUSINESS_REGISTRATION')?.fileUrl && (
                                <a
                                    href={getDocByType('BUSINESS_REGISTRATION')?.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-gray-600 hover:text-[#C6A96A] inline-flex items-center gap-1"
                                >
                                    View uploaded <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        {getDocByType('BUSINESS_REGISTRATION') && !canReplaceAgentDoc(getDocByType('BUSINESS_REGISTRATION')?.status) && (
                            <p className="text-[11px] text-gray-500 mt-2">Submitted proof is locked unless admin rejects it.</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#1C2430] block">
                            Tax ID / Info <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="Tax ID"
                            className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                            required
                        />
                        <div className="flex items-center gap-3 pt-1">
                            <label className={`text-xs font-semibold inline-flex items-center gap-1.5 ${canReplaceAgentDoc(getDocByType('TAX_PAN')?.status) ? 'text-[#C6A96A] hover:text-[#B8954F] cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                                <UploadCloud className="w-3.5 h-3.5" />
                                {uploadingType === 'TAX_PAN'
                                    ? 'Uploading...'
                                    : getDocByType('TAX_PAN')
                                        ? (canReplaceAgentDoc(getDocByType('TAX_PAN')?.status) ? 'Upload revised proof' : 'Proof locked')
                                        : 'Upload proof'}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={uploadingType !== null || !canReplaceAgentDoc(getDocByType('TAX_PAN')?.status)}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadAgentDocument('TAX_PAN', 'Tax PAN / Tax Document', file);
                                        e.currentTarget.value = '';
                                    }}
                                />
                            </label>
                            {getDocByType('TAX_PAN')?.fileUrl && (
                                <a
                                    href={getDocByType('TAX_PAN')?.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-gray-600 hover:text-[#C6A96A] inline-flex items-center gap-1"
                                >
                                    View uploaded <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        {getDocByType('TAX_PAN') && !canReplaceAgentDoc(getDocByType('TAX_PAN')?.status) && (
                            <p className="text-[11px] text-gray-500 mt-2">Submitted proof is locked unless admin rejects it.</p>
                        )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[13px] font-semibold text-[#1C2430] block">
                            Identity Document (Passport / Aadhar / ECI) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={directorId}
                            onChange={(e) => setDirectorId(e.target.value)}
                            placeholder="Identity document number"
                            className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                            required
                        />
                        <div className="flex items-center gap-3 pt-1">
                            <label className={`text-xs font-semibold inline-flex items-center gap-1.5 ${canReplaceAgentDoc(getDocByType('IDENTITY_DOCUMENT')?.status) ? 'text-[#C6A96A] hover:text-[#B8954F] cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                                <UploadCloud className="w-3.5 h-3.5" />
                                {uploadingType === 'IDENTITY_DOCUMENT'
                                    ? 'Uploading...'
                                    : getDocByType('IDENTITY_DOCUMENT')
                                        ? (canReplaceAgentDoc(getDocByType('IDENTITY_DOCUMENT')?.status) ? 'Upload revised proof' : 'Proof locked')
                                        : 'Upload proof'}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={uploadingType !== null || !canReplaceAgentDoc(getDocByType('IDENTITY_DOCUMENT')?.status)}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadAgentDocument('IDENTITY_DOCUMENT', 'Identity Document', file);
                                        e.currentTarget.value = '';
                                    }}
                                />
                            </label>
                            {getDocByType('IDENTITY_DOCUMENT')?.fileUrl && (
                                <a
                                    href={getDocByType('IDENTITY_DOCUMENT')?.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-gray-600 hover:text-[#C6A96A] inline-flex items-center gap-1"
                                >
                                    View uploaded <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        {getDocByType('IDENTITY_DOCUMENT') && !canReplaceAgentDoc(getDocByType('IDENTITY_DOCUMENT')?.status) && (
                            <p className="text-[11px] text-gray-500 mt-2">Submitted proof is locked unless admin rejects it.</p>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[50px] bg-[#C6A96A] hover:bg-[#B8954F] text-[#0F1B2D] font-bold text-[15px] rounded-[12px] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        {isLoading ? 'Submitting...' : isSubmitted ? 'Update Profile Submission' : 'Complete Profile & Submit for Review'}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-4 font-medium">
                        By submitting, you agree to our Terms of Service as an Agent Partner.
                    </p>
                </div>
            </form>
        </div>
    );
}
