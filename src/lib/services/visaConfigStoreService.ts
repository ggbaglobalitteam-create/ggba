import { VisaConfig } from '@/types/visa';
import { localStorageAdapter } from '../adapters/localStorageAdapter';

const STORAGE_KEY = 'ggba_visa_configs';

export type StoredVisaConfigStatus = 'draft' | 'published';

export type StoredVisaConfig = VisaConfig & {
    key: string;
    status: StoredVisaConfigStatus;
    createdAt: string;
    updatedAt: string;
};

const loadAll = (): StoredVisaConfig[] => {
    return localStorageAdapter.get<StoredVisaConfig[]>(STORAGE_KEY) || [];
};

const persistAll = (items: StoredVisaConfig[]) => {
    localStorageAdapter.save(STORAGE_KEY, items);
};

export const visaConfigStoreService = {
    async getAll(): Promise<StoredVisaConfig[]> {
        return loadAll();
    },

    async getByKey(key: string): Promise<StoredVisaConfig | null> {
        const all = loadAll();
        return all.find((c) => c.key === key) || null;
    },

    async save(key: string, config: VisaConfig, status: StoredVisaConfigStatus): Promise<void> {
        const now = new Date().toISOString();
        const all = loadAll();
        const existingIndex = all.findIndex((c) => c.key === key);

        if (existingIndex >= 0) {
            all[existingIndex] = {
                ...config,
                key,
                status,
                createdAt: all[existingIndex].createdAt,
                updatedAt: now,
            };
        } else {
            all.push({
                ...config,
                key,
                status,
                createdAt: now,
                updatedAt: now,
            });
        }

        persistAll(all);
    },

    async delete(key: string): Promise<void> {
        const all = loadAll().filter((c) => c.key !== key);
        persistAll(all);
    },

    async publish(key: string): Promise<void> {
        const all = loadAll();
        const index = all.findIndex((c) => c.key === key);
        if (index === -1) return;

        const now = new Date().toISOString();
        all[index] = {
            ...all[index],
            status: 'published',
            updatedAt: now,
        };

        persistAll(all);
    },
};

