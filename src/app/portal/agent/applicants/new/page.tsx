"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Card } from '@/components/portal/Card';
import { Button } from '@/components/portal/Button';
import { StepProgress } from '@/components/portal/StepProgress';
import { GatewaySelector } from '@/components/portal/GatewaySelector';
import { DynamicStepForm } from '@/components/portal/DynamicStepForm';
import { DocumentsSidebar } from '@/components/portal/DocumentsSidebar';
import { ApplicationReview } from '@/components/portal/ApplicationReview';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VisaConfig, ApplicationFormState, ApplicationGatewayState } from '@/types/visa';
import { applicationService } from '@/lib/services/applicationService';
import { agentService, AgentStatus } from '@/lib/services/agentService';
import { visaConfigService } from '@/lib/services/visaConfigService';
import { getFirstValidationError, validateStepData } from '@/lib/formValidation';
import { getPostDocumentsRoute, resolveFlow, toAgentRoute } from '@/lib/applicationFlow';
import { useSession } from 'next-auth/react';

const AGENT_ACTIVE_CREATION_KEY = 'ggba_agent_active_creation_id';

function NewApplicantContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status: sessionStatus } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [gatewayState, setGatewayState] = useState<ApplicationGatewayState | null>(null);
    const [visaConfig, setVisaConfig] = useState<VisaConfig | null>(null);
    const [applicantId, setApplicantId] = useState<string | null>(null);
    const [formState, setFormState] = useState<ApplicationFormState>({ currentStep: 0, formData: {} });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [approvalChecked, setApprovalChecked] = useState(false);
    const [canCreate, setCanCreate] = useState(false);
    const [agentApprovalStatus, setAgentApprovalStatus] = useState<AgentStatus | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const requestedApplicationId = searchParams.get('applicationId');

    useEffect(() => {
        let disposed = false;

        async function checkApproval() {
            if (sessionStatus === 'loading') return;

            const userId = (session?.user as { id?: string } | undefined)?.id;
            if (!userId) {
                if (!disposed) {
                    setApprovalChecked(true);
                    setCanCreate(false);
                    setAgentApprovalStatus(null);
                }
                return;
            }

            const profile = await agentService.getAgent(userId);
            if (!disposed) {
                setAgentApprovalStatus(profile?.status ?? null);
                setCanCreate(profile?.status === 'approved');
                setApprovalChecked(true);
            }
        }

        void checkApproval();

        return () => {
            disposed = true;
        };
    }, [session, sessionStatus]);

    // Load initial session on mount
    useEffect(() => {
        if (!approvalChecked) return;
        if (!canCreate) {
            setIsLoading(false);
            return;
        }

        let disposed = false;

        async function init() {
            try {
                const activeId = requestedApplicationId?.trim() || localStorage.getItem(AGENT_ACTIVE_CREATION_KEY);
                if (!activeId) return;

                if (disposed) return;
                setApplicantId(activeId);
                localStorage.setItem(AGENT_ACTIVE_CREATION_KEY, activeId);

                const gateway = await applicationService.getGatewayState(activeId);
                if (!gateway) {
                    localStorage.removeItem(AGENT_ACTIVE_CREATION_KEY);
                    if (disposed) return;
                    setApplicantId(null);
                    return;
                }

                if (disposed) return;
                setGatewayState(gateway);

                const config = await visaConfigService.getActiveConfig(activeId);
                if (!config) {
                    localStorage.removeItem(AGENT_ACTIVE_CREATION_KEY);
                    if (disposed) return;
                    setApplicantId(null);
                    setGatewayState(null);
                    return;
                }

                if (disposed) return;
                setVisaConfig(config);

                const form = await applicationService.getApplication(activeId);
                if (form && !disposed) {
                    setFormState(form);
                    setIsSubmitted(Boolean(form.isSubmitted));
                }
            } catch (error) {
                console.error('Failed to restore active applicant draft', error);
                localStorage.removeItem(AGENT_ACTIVE_CREATION_KEY);
                if (!disposed) {
                    setApplicantId(null);
                    setGatewayState(null);
                    setVisaConfig(null);
                }
            } finally {
                if (!disposed) {
                    setIsLoading(false);
                }
            }
        }

        void init();

        return () => {
            disposed = true;
        };
    }, [approvalChecked, canCreate, requestedApplicationId]);

    const handleGatewayContinue = async (purpose: string, country: string, configKey?: string) => {
        const newState = { purpose, destinationCountry: country, startedAt: new Date().toISOString(), configKey };
        try {
            const created = await applicationService.createApplication(newState, { rememberAsCurrent: false });
            const newId = created.id;
            setApplicantId(newId);
            localStorage.setItem(AGENT_ACTIVE_CREATION_KEY, newId);

            setGatewayState(newState);

            const config = await visaConfigService.getById(newId);
            if (!config) {
                throw new Error('Configuration not found for selected visa flow');
            }
            setVisaConfig(config);

            // Fresh form for new creation
            const newFormState: ApplicationFormState = {
                currentStep: 0,
                formData: {}
            };

            setFormState(newFormState);
            setIsSubmitted(false);
            await applicationService.saveApplication(newFormState, newId);
        } catch (error) {
            console.error('Failed to create a new applicant application', error);
            const message = error instanceof Error && error.message ? error.message : 'Unable to start a new application. Please try again.';
            alert(message);
        }
    };

    const handleFormChange = (fieldName: string, value: unknown) => {
        if (!applicantId || isSubmitted) return;
        const updatedFormState = {
            ...formState,
            formData: { ...formState.formData, [fieldName]: value }
        };
        setFormState(updatedFormState);
        setFieldErrors(prev => {
            if (!prev[fieldName]) return prev;
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
        applicationService.saveApplication(updatedFormState, applicantId);
    };

    const handleNext = async () => {
        if (!visaConfig || !applicantId || isSubmitted) return;
        const errors = validateStepData(currentStepConfig, formState.formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            const first = getFirstValidationError(errors);
            if (first) alert(first);
            return;
        }
        setFieldErrors({});
        const nextStepIndex = Math.min(visaConfig.steps.length - 1, formState.currentStep + 1);
        const updatedState = { ...formState, currentStep: nextStepIndex };
        setFormState(updatedState);
        await applicationService.updateCurrentStep(nextStepIndex, applicantId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrev = async () => {
        if (!applicantId || isSubmitted) return;
        const prevStepIndex = Math.max(0, formState.currentStep - 1);
        const updatedState = { ...formState, currentStep: prevStepIndex };
        setFormState(updatedState);
        await applicationService.updateCurrentStep(prevStepIndex, applicantId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditStep = async (stepIndex: number) => {
        if (!applicantId || isSubmitted) return;
        const updatedState = { ...formState, currentStep: stepIndex };
        setFormState(updatedState);
        await applicationService.updateCurrentStep(stepIndex, applicantId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!applicantId || isSubmitted) return;
        try {
            await applicationService.submitApplication(formState, applicantId);
            setIsSubmitted(true);
            localStorage.removeItem(AGENT_ACTIVE_CREATION_KEY);
            const flow = resolveFlow(visaConfig);
            if (flow.requiresDocuments && visaConfig?.documentsRequired.length) {
                router.push(`/portal/agent/upload-documents/${applicantId}`);
                return;
            }
            router.push(toAgentRoute(getPostDocumentsRoute(visaConfig), applicantId));
        } catch (error) {
            console.error('Application submission failed', error);
            alert(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
        }
    };

    const handleStartFresh = async () => {
        if (!applicantId || isSubmitted) return;
        if (!window.confirm('Cancel this application draft? This action cannot be undone.')) return;
        await applicationService.cancelApplication(applicantId);
        await applicationService.clearGatewayState(applicantId);
        localStorage.removeItem(AGENT_ACTIVE_CREATION_KEY);
        router.push('/portal/agent/applicants');
    };

    if (sessionStatus === 'loading' || !approvalChecked || isLoading) {
        return <div className="min-h-screen flex items-center justify-center font-medium text-gray-400">Loading Configuration...</div>;
    }

    if (!canCreate) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/portal/agent/applicants" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#C6A96A] mb-2 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Applicants
                </Link>
                <Card className="p-6 sm:p-8 border-0 ring-1 ring-amber-200 bg-amber-50/40">
                    <h1 className="text-2xl font-bold text-amber-900 tracking-tight">Application Creation Restricted</h1>
                    <p className="text-amber-800 mt-3">
                        You can create new applications only after admin approval.
                        {agentApprovalStatus ? ` Current status: ${agentApprovalStatus}.` : ''}
                    </p>
                    <div className="mt-5">
                        <Link href="/portal/agent/dashboard">
                            <Button variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">Go to Dashboard</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    // Phase 1: Gateway Selection (same as applicant)
    if (!gatewayState || !visaConfig) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/portal/agent/applicants" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#C6A96A] mb-2 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Applicants
                </Link>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Add New Applicant</h1>
                    <p className="text-gray-500 font-medium tracking-tight">Select the visa purpose and destination to start a new application.</p>
                </div>
                <GatewaySelector onContinue={handleGatewayContinue} />
            </div>
        );
    }

    const currentStepConfig = visaConfig.steps[formState.currentStep];
    const isReviewStep = currentStepConfig.id === 'review';
    const flow = resolveFlow(visaConfig);
    const showDocumentsSidebar = flow.requiresDocuments && visaConfig.documentsRequired.length > 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <Link href="/portal/agent/applicants" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-[#C6A96A] mb-3 transition-colors uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3 mr-2" />
                        Back to Applicants
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">Applicant Details</h1>
                    <p className="text-[#C6A96A] font-medium text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C6A96A]"></span>
                        {gatewayState.destinationCountry} - {gatewayState.purpose}
                    </p>
                    {isSubmitted && (
                        <p className="text-sm text-emerald-700 font-medium mt-2">
                            Submitted. Application editing is locked.
                        </p>
                    )}
                </div>
                <button
                    onClick={handleStartFresh}
                    disabled={isSubmitted}
                    className="text-xs font-bold text-gray-400 enabled:hover:text-rose-500 transition-colors uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 enabled:hover:border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel Application
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className={showDocumentsSidebar ? "xl:col-span-8" : "xl:col-span-12"}>
                    <Card className="p-5 sm:p-8 shadow-sm border-0 ring-1 ring-gray-200">
                        <StepProgress steps={visaConfig.steps.map(s => s.title)} currentStep={formState.currentStep} />

                        <div className="mt-8 sm:mt-12 min-h-[400px]">
                            {isReviewStep ? (
                                <ApplicationReview config={visaConfig} onEditStep={handleEditStep} applicationId={applicantId || undefined} />
                            ) : (
                                <DynamicStepForm
                                    stepConfig={currentStepConfig}
                                    initialData={formState.formData}
                                    onDataChange={handleFormChange}
                                    fieldErrors={fieldErrors}
                                />
                            )}
                        </div>

                        <div className="mt-12 flex justify-between pt-6 border-t border-gray-100">
                            <Button variant="outline" onClick={handlePrev} disabled={isSubmitted || formState.currentStep === 0} className="px-6">
                                Previous
                            </Button>
                            {formState.currentStep < visaConfig.steps.length - 1 ? (
                                <Button disabled={isSubmitted} onClick={handleNext} className="px-8 shadow-md transition-all hover:-translate-y-0.5" >Next Step</Button>
                            ) : (
                                <Button disabled={isSubmitted} variant="primary" onClick={handleSubmit} className="px-8 shadow-md bg-emerald-600 hover:bg-emerald-700 border-emerald-600 transition-all hover:-translate-y-0.5">Finalize Application</Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Desktop Documents Sidebar */}
                {showDocumentsSidebar && (
                    <div className="hidden xl:block xl:col-span-4 self-start sticky top-8 animate-in slide-in-from-right-8 duration-500 fade-in">
                        <DocumentsSidebar documentsRequired={visaConfig.documentsRequired} applicationId={applicantId || undefined} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function NewApplicantPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-medium text-gray-400">Loading Application...</div>}>
            <NewApplicantContent />
        </Suspense>
    );
}
