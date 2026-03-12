export type AgentStatus = 'pending' | 'approved' | 'rejected';

export interface AgentProfile {
    id: string; // agent id
    userId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: AgentStatus;
    isProfileComplete: boolean;

    // Agent Specific Fields (Completed later)
    companyName?: string;
    address?: string;
    businessRegistrationNo?: string;
    taxId?: string;
    directorId?: string;

    createdAt: string;
}

export type AgentProfileDraft = {
    companyName: string;
    address: string;
    businessRegistrationNo: string;
    taxId: string;
    directorId: string;
    submitted: boolean;
};

type AgentProfileDto = {
    id: string;
    userId?: string;
    status?: string;
    companyName?: string | null;
    address?: string | null;
    businessRegistrationNo?: string | null;
    taxId?: string | null;
    directorId?: string | null;
    createdAt?: string;
    user?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
    } | null;
};

function hasValue(value: unknown): boolean {
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function isAgentProfileSubmitted(dto: AgentProfileDto): boolean {
    return Boolean(
        hasValue(dto.companyName) &&
        hasValue(dto.address) &&
        hasValue(dto.businessRegistrationNo) &&
        hasValue(dto.taxId) &&
        hasValue(dto.directorId)
    );
}

export function getAgentProfileDraftKey(agentId: string) {
    return `ggba_agent_profile_draft_${agentId}`;
}

export function readAgentProfileDraft(agentId: string): AgentProfileDraft | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(getAgentProfileDraftKey(agentId));
        if (!raw) return null;
        return JSON.parse(raw) as AgentProfileDraft;
    } catch {
        return null;
    }
}

export function writeAgentProfileDraft(agentId: string, draft: AgentProfileDraft) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getAgentProfileDraftKey(agentId), JSON.stringify(draft));
}

export function readAgentProfileDraftForIds(...ids: Array<string | undefined>) {
    for (const id of ids) {
        if (!id) continue;
        const draft = readAgentProfileDraft(id);
        if (draft) return draft;
    }
    return null;
}

export function writeAgentProfileDraftForIds(draft: AgentProfileDraft, ...ids: Array<string | undefined>) {
    const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
    uniqueIds.forEach((id) => writeAgentProfileDraft(id, draft));
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

function toAgentProfile(dto: AgentProfileDto): AgentProfile {
    const status = String(dto.status || '').toLowerCase() as AgentStatus;
    const user = dto.user || {};
    return {
        id: dto.id,
        userId: dto.userId,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        status,
        isProfileComplete: isAgentProfileSubmitted(dto),
        companyName: dto.companyName || undefined,
        address: dto.address || undefined,
        businessRegistrationNo: dto.businessRegistrationNo || undefined,
        taxId: dto.taxId || undefined,
        directorId: dto.directorId || undefined,
        createdAt: dto.createdAt || new Date().toISOString(),
    };
}

export const agentService = {
    // Register a new agent profile with basic info
    registerAgent: async (): Promise<AgentProfile> => {
        // Registration is handled by the real auth flow: POST /api/auth/register (with password).
        // Keeping this method only so older pages don't crash, but it should not be used.
        throw new Error('Agent registration is now handled via /portal/register (NextAuth).');
    },

    // Get an agent profile by ID (agent id or user id)
    getAgent: async (id: string): Promise<AgentProfile | null> => {
        try {
            const dto = await api<AgentProfileDto>(`/api/agents/${encodeURIComponent(id)}/profile`);
            return toAgentProfile(dto);
        } catch {
            return null;
        }
    },

    // Get all agent profiles
    getAllAgents: async (): Promise<AgentProfile[]> => {
        const dto = await api<{ items?: AgentProfileDto[] }>(`/api/agents`);
        const items = Array.isArray(dto?.items) ? dto.items : [];
        return items.map((x) => toAgentProfile({ ...x, user: x.user }));
    },

    // Complete/Update the agent profile with mandatory fields
    completeProfile: async (id: string, details: Omit<AgentProfile, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'status' | 'isProfileComplete' | 'createdAt'>): Promise<AgentProfile | null> => {
        const dto = await api<AgentProfileDto>(`/api/agents/${encodeURIComponent(id)}/profile`, {
            method: 'PATCH',
            body: JSON.stringify({
                companyName: details.companyName,
                address: details.address,
                businessRegistrationNo: details.businessRegistrationNo,
                taxId: details.taxId,
                directorId: details.directorId,
            })
        });
        return toAgentProfile(dto);
    },

    // Update agent status (e.g. for admin or testing purposes)
    updateAgentStatus: async (id: string, status: AgentStatus): Promise<AgentProfile | null> => {
        const dto = await api<AgentProfileDto>(`/api/agents/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: status.toUpperCase() }),
        });
        return toAgentProfile(dto);
    }
};
