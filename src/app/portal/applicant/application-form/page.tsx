"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/portal/Card';
import { Button } from '@/components/portal/Button';
import { StepProgress } from '@/components/portal/StepProgress';
import { GatewaySelector } from '@/components/portal/GatewaySelector';
import { DynamicStepForm } from '@/components/portal/DynamicStepForm';
import { DocumentsSidebar } from '@/components/portal/DocumentsSidebar';
import { ApplicationReview } from '@/components/portal/ApplicationReview';
import { useRouter } from 'next/navigation';
import { VisaConfig, ApplicationFormState, ApplicationGatewayState } from '@/types/visa';
import { applicationService } from '@/lib/services/applicationService';
import { visaConfigService } from '@/lib/services/visaConfigService';
import { getRouteAfterForm, resolveFlow } from '@/lib/applicationFlow';
import { getFirstValidationError, validateStepData } from '@/lib/formValidation';

export default function ApplicationFormPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gatewayState, setGatewayState] = useState<ApplicationGatewayState | null>(null);
    const [visaConfig, setVisaConfig] = useState<VisaConfig | null>(null);
    const [formState, setFormState] = useState<ApplicationFormState>({ currentStep: 0, formData: {} });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isGatewayEditMode, setIsGatewayEditMode] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedAt, setSubmittedAt] = useState<string | undefined>(undefined);

    const getPrefilledDraft = () => {
        const prefilledData: Record<string, unknown> = {};
        const prefilledFields: string[] = [];

        try {
            const profileStr = localStorage.getItem('ggba_user_profile');
            if (profileStr) {
                const profile = JSON.parse(profileStr);

                if (profile.name) {
                    const nameParts = profile.name.split(' ');
                    prefilledData.firstName = nameParts[0] || '';
                    prefilledData.lastName = nameParts.slice(1).join(' ') || '';
                    if (prefilledData.firstName) prefilledFields.push('firstName');
                    if (prefilledData.lastName) prefilledFields.push('lastName');
                }

                if (profile.email) {
                    prefilledData.email = profile.email;
                    prefilledFields.push('email');
                }

                if (profile.phone) {
                    prefilledData.phone = profile.phone;
                    prefilledFields.push('phone');
                }

                if (profile.nationality) {
                    prefilledData.nationality = profile.nationality;
                    prefilledFields.push('nationality');
                }
            }
        } catch (e) {
            console.error('Failed to parse user profile', e);
        }

        return {
            currentStep: 0,
            formData: prefilledData,
            prefilledFields: prefilledFields.length > 0 ? prefilledFields : undefined
        } as ApplicationFormState;
    };

    // Load initial session on mount
    useEffect(() => {
        const forceNew =
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('new') === '1';

        async function init() {
            if (forceNew) {
                applicationService.clearCurrentApplicationId();
                setGatewayState(null);
                setVisaConfig(null);
                setFormState({ currentStep: 0, formData: {} });
                setIsSubmitted(false);
                setSubmittedAt(undefined);
                setIsLoading(false);
                return;
            }

            const gateway = await applicationService.getGatewayState();
            if (gateway) {
                setGatewayState(gateway);
                const config = await visaConfigService.getActiveConfig();
                setVisaConfig(config!);

                const form = await applicationService.getApplication();
                if (form) {
                    setFormState(form);
                    setIsSubmitted(Boolean(form.isSubmitted));
                    setSubmittedAt(form.submittedAt);
                }
            }
            setIsLoading(false);
        }
        init();
    }, []);

    const handleGatewayContinue = async (purpose: string, country: string, configKey?: string) => {
        const newState = { purpose, destinationCountry: country, startedAt: new Date().toISOString(), configKey };
        if (isGatewayEditMode) {
            await applicationService.updateGatewaySelection({ ...newState, resetForm: true });
        } else {
            await applicationService.saveGatewayState(newState);
        }
        setGatewayState(newState);
        setIsGatewayEditMode(false);

        const config = await visaConfigService.getActiveConfig();
        setVisaConfig(config!);
        setFieldErrors({});
        setIsSubmitted(false);
        setSubmittedAt(undefined);

        // Ensure form is fresh but pre-filled
        const newFormState = getPrefilledDraft();

        setFormState(newFormState);
        await applicationService.saveApplication(newFormState);
    };

    const handleFormChange = (fieldName: string, value: unknown) => {
        if (isSubmitted) return;
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
        applicationService.saveApplication(updatedFormState);
    };

    const handleNext = async () => {
        if (!visaConfig || isSubmitted) return;

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
        await applicationService.updateCurrentStep(nextStepIndex);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrev = async () => {
        if (isSubmitted) return;
        const prevStepIndex = Math.max(0, formState.currentStep - 1);
        const updatedState = { ...formState, currentStep: prevStepIndex };
        setFormState(updatedState);
        await applicationService.updateCurrentStep(prevStepIndex);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditStep = async (stepIndex: number) => {
        if (isSubmitted) return;
        const updatedState = { ...formState, currentStep: stepIndex };
        setFormState(updatedState);
        await applicationService.updateCurrentStep(stepIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (isSubmitted || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await applicationService.submitApplication(formState);
            const refreshed = await applicationService.getApplication();
            if (refreshed?.isSubmitted) {
                setIsSubmitted(true);
                setSubmittedAt(refreshed.submittedAt);
            }
            router.push(getRouteAfterForm(visaConfig));
        } catch (error) {
            console.error('Application submission failed', error);
            alert(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelApplication = async () => {
        if (isSubmitted) return;
        if (!window.confirm('Remove this incomplete application and form data? This action cannot be undone.')) return;
        await applicationService.cancelApplication();
        await applicationService.clearGatewayState();
        window.location.reload();
    };

    // Render loading state securely avoiding hydration mismatch flashes
    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div></div>;

    // Step 0: Gateway Selector
    if (!gatewayState || !visaConfig || isGatewayEditMode) {
        return (
            <div className="space-y-4">
                {isGatewayEditMode && (
                    <div className="max-w-2xl mx-auto flex justify-end">
                        <Button variant="outline" onClick={() => setIsGatewayEditMode(false)}>
                            Cancel Change
                        </Button>
                    </div>
                )}
                <GatewaySelector
                    onContinue={handleGatewayContinue}
                    initialCountry={gatewayState?.destinationCountry}
                    initialConfigKey={gatewayState?.configKey}
                />
            </div>
        );
    }

    const currentStepConfig = visaConfig.steps[formState.currentStep];
    const isReviewStep = currentStepConfig.id === 'review';
    const flow = resolveFlow(visaConfig);
    const showDocumentsSidebar = flow.requiresDocuments && visaConfig.documentsRequired.length > 0;

    // To display Warnings specific to steps
    const getWarningsForStep = () => {
        if (!visaConfig.embassyWarnings) return null;

        const matchingWarnings = visaConfig.embassyWarnings.filter(w => {
            if (isReviewStep && w.toLowerCase().includes('processing time')) return true;
            if (currentStepConfig.id === 'contact-details' && w.toLowerCase().includes('missing')) return true;
            if (currentStepConfig.id === 'sponsor-financial' && w.toLowerCase().includes('bank')) return true;
            return false;
        });

        if (matchingWarnings.length === 0) return null;

        return (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-2 animate-in slide-in-from-top-4">
                {matchingWarnings.map((w, i) => (
                    <p key={i} className="flex gap-2 items-start"><span className="text-amber-500 mt-0.5">⚠️</span> <span>{w}</span></p>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Application Form</h1>
                    <p className="text-[#C6A96A] font-medium">{gatewayState.destinationCountry} - {gatewayState.purpose}</p>
                    {isSubmitted && (
                        <p className="text-sm text-emerald-700 font-medium mt-2">
                            Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : ''}. Form editing is locked.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isSubmitted && (
                        <Button
                            variant="outline"
                            onClick={() => setIsGatewayEditMode(true)}
                            className="text-xs"
                        >
                            Change Country / Category
                        </Button>
                    )}
                    {!isSubmitted && (
                        <button
                            onClick={handleCancelApplication}
                            className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
                        >
                            Remove Application
                        </button>
                    )}
                    {isSubmitted && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                applicationService.clearCurrentApplicationId();
                                router.push('/portal/applicant/application-form?new=1');
                            }}
                            className="text-xs"
                        >
                            Start New Application
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className={showDocumentsSidebar ? "xl:col-span-8" : "xl:col-span-12"}>
                    <Card className="p-5 sm:p-8 shadow-sm">
                        <StepProgress steps={visaConfig.steps.map(s => s.title)} currentStep={formState.currentStep} />
                        <div className="mt-8 sm:mt-12 min-h-[400px]">
                            {getWarningsForStep()}

                            {isReviewStep ? (
                                <ApplicationReview config={visaConfig} onEditStep={handleEditStep} />
                            ) : (
                                <DynamicStepForm
                                    stepConfig={currentStepConfig}
                                    initialData={formState.formData}
                                    onDataChange={handleFormChange}
                                    prefilledFields={formState.prefilledFields}
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
                                <Button disabled={isSubmitted || isSubmitting} variant="primary" onClick={handleSubmit} className="px-8 shadow-md bg-emerald-600 hover:bg-emerald-700 ring-emerald-600 transition-all hover:-translate-y-0.5">{isSubmitting ? 'Submitting...' : 'Submit Details'}</Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Desktop Documents Sidebar */}
                {showDocumentsSidebar && (
                    <div className="hidden xl:block xl:col-span-4 self-start sticky top-8 animate-in slide-in-from-right-8 duration-500 fade-in">
                        <DocumentsSidebar documentsRequired={visaConfig.documentsRequired} />
                    </div>
                )}
            </div>
        </div>
    );
}
