import { ApplicationFormState, ApplicationGatewayState } from '@/types/visa';

const CURRENT_APP_ID_KEY = 'ggba_current_application_id';
const SUBMITTED_AT_KEY = '__submittedAt';

function getCurrentApplicationId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.sessionStorage.getItem(CURRENT_APP_ID_KEY) || undefined;
}

function setCurrentApplicationId(id: string) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(CURRENT_APP_ID_KEY, id);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(init?.headers || {}),
        },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Request failed');
    }
    return await res.json() as T;
}

type ApplicationDto = {
    id: string;
    purpose?: string;
    destinationCountry?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: string;
    visaConfigKey?: string;
    formData?: Record<string, unknown>;
};

type ApplicationListResponse = {
    items?: ApplicationDto[];
};

async function resolveApplicationId(applicationId?: string): Promise<string | undefined> {
    if (applicationId) return applicationId;
    return getCurrentApplicationId();
}

export const applicationService = {
    getCurrentApplicationId: (): string | undefined => getCurrentApplicationId(),
    setCurrentApplicationId: (id: string): void => setCurrentApplicationId(id),
    clearCurrentApplicationId: (): void => {
        if (typeof window === 'undefined') return;
        window.sessionStorage.removeItem(CURRENT_APP_ID_KEY);
    },
    listApplications: async (): Promise<ApplicationDto[]> => {
        const res = await api<ApplicationListResponse>('/api/applications');
        return Array.isArray(res.items) ? res.items : [];
    },
    createApplication: async (
        data: Pick<ApplicationGatewayState, 'purpose' | 'destinationCountry' | 'configKey'>,
        options?: { rememberAsCurrent?: boolean }
    ): Promise<{ id: string }> => {
        const created = await api<{ id: string }>(`/api/applications`, {
            method: 'POST',
            body: JSON.stringify({
                purpose: data.purpose,
                destinationCountry: data.destinationCountry,
                configKey: data.configKey,
            })
        });
        if (options?.rememberAsCurrent !== false) {
            setCurrentApplicationId(created.id);
        }
        return created;
    },

    // ---- Gateway State ----
    getGatewayState: async (applicationId?: string): Promise<ApplicationGatewayState | null> => {
        const id = await resolveApplicationId(applicationId);
        if (!id) return null;
        const app = await api<ApplicationDto>(`/api/applications/${encodeURIComponent(id)}`);
        return {
            purpose: app.purpose || '',
            destinationCountry: app.destinationCountry || '',
            startedAt: app.createdAt || new Date().toISOString(),
            configKey: app.visaConfigKey || undefined,
        };
    },
    updateGatewaySelection: async (
        data: Pick<ApplicationGatewayState, 'purpose' | 'destinationCountry' | 'configKey'> & { resetForm?: boolean },
        applicationId?: string
    ): Promise<void> => {
        const id = await resolveApplicationId(applicationId);
        if (!id) throw new Error('No active application found');
        await api<unknown>(`/api/applications/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({
                purpose: data.purpose,
                destinationCountry: data.destinationCountry,
                configKey: data.configKey,
                resetForm: Boolean(data.resetForm),
            }),
        });
    },
    saveGatewayState: async (data: ApplicationGatewayState, applicationId?: string): Promise<void> => {
        // If no application exists yet, create it and store as current app ID.
        if (!applicationId && !getCurrentApplicationId()) {
            await applicationService.createApplication(data);
            return;
        }
        // Gateway fields live on Application; nothing else to persist here for now.
    },
    clearGatewayState: async (applicationId?: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        if (!applicationId) window.sessionStorage.removeItem(CURRENT_APP_ID_KEY);
    },

    // ---- Form State ----
    getApplication: async (applicationId?: string): Promise<ApplicationFormState | null> => {
        const id = await resolveApplicationId(applicationId);
        if (!id) return null;
        const app = await api<ApplicationDto>(`/api/applications/${encodeURIComponent(id)}`);
        const formData = (app.formData || {}) as Record<string, unknown>;
        const currentStep = typeof formData.currentStep === 'number' ? formData.currentStep : 0;
        const submittedAt = typeof formData[SUBMITTED_AT_KEY] === 'string' ? String(formData[SUBMITTED_AT_KEY]) : undefined;
        // Strip the currentStep helper from formData to match existing UI expectation
        const rest = { ...formData };
        delete rest.currentStep;
        delete rest[SUBMITTED_AT_KEY];
        return { currentStep, formData: rest, isSubmitted: Boolean(submittedAt), submittedAt };
    },
    saveApplication: async (data: ApplicationFormState, applicationId?: string): Promise<void> => {
        const id = await resolveApplicationId(applicationId);
        if (!id) return;
        await api<unknown>(`/api/applications/${encodeURIComponent(id)}/form`, {
            method: 'PATCH',
            body: JSON.stringify({ currentStep: data.currentStep, stepData: { ...data.formData } }),
        });
    },
    updateStep: async (step: number, data: Record<string, unknown>, applicationId?: string): Promise<void> => {
        const id = await resolveApplicationId(applicationId);
        if (!id) return;
        await api<unknown>(`/api/applications/${encodeURIComponent(id)}/form`, {
            method: 'PATCH',
            body: JSON.stringify({ currentStep: step, stepData: data }),
        });
    },
    updateCurrentStep: async (step: number, applicationId?: string): Promise<void> => {
        const id = await resolveApplicationId(applicationId);
        if (!id) return;
        await api<unknown>(`/api/applications/${encodeURIComponent(id)}/form`, {
            method: 'PATCH',
            body: JSON.stringify({ currentStep: step, stepData: {} }),
        });
    },
    submitApplication: async (data: ApplicationFormState, applicationId?: string): Promise<void> => {
        await applicationService.saveApplication(data, applicationId);
        const id = await resolveApplicationId(applicationId);
        if (!id) return;
        await api<unknown>(`/api/applications/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'SUBMIT' }),
        });
    },
    cancelApplication: async (applicationId?: string): Promise<void> => {
        const id = await resolveApplicationId(applicationId);
        if (!id) return;
        await api<unknown>(`/api/applications/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        if (getCurrentApplicationId() === id) {
            applicationService.clearCurrentApplicationId();
        }
    },
    clearApplication: async (applicationId?: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        if (!applicationId) window.sessionStorage.removeItem(CURRENT_APP_ID_KEY);
    }
};
