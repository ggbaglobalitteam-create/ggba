import { VisaConfig } from '@/types/visa';
import { GEORGIA_STUDENT, BELARUS_STUDENT } from './visaConfigs/student';
import { GEORGIA_TOURIST, BELARUS_TOURIST } from './visaConfigs/tourist';
import { GEORGIA_BUSINESS, BELARUS_BUSINESS, GEORGIA_WORK, BELARUS_WORK, GEORGIA_MEDICAL, BELARUS_MEDICAL, GEORGIA_TRANSIT, BELARUS_TRANSIT, GEORGIA_FAMILY, BELARUS_FAMILY } from './visaConfigs/other';
import { visaConfigStoreService } from './services/visaConfigStoreService';
import { normalizeVisaConfig } from './visaConfigSchema';

export const VISA_CONFIGS: Record<string, VisaConfig> = {
    // For Student Visa
    'georgia-student-visa': GEORGIA_STUDENT,
    'belarus-student-visa': BELARUS_STUDENT,

    // For Tourist / Visitor Visa
    'georgia-tourist-/-visitor-visa': GEORGIA_TOURIST,
    'belarus-tourist-/-visitor-visa': BELARUS_TOURIST,

    // Business Visa
    'georgia-business-visa': GEORGIA_BUSINESS,
    'belarus-business-visa': BELARUS_BUSINESS,

    // Work Visa
    'georgia-work-visa': GEORGIA_WORK,
    'belarus-work-visa': BELARUS_WORK,

    // Medical Visa
    'georgia-medical-visa': GEORGIA_MEDICAL,
    'belarus-medical-visa': BELARUS_MEDICAL,

    // Transit Visa
    'georgia-transit-visa': GEORGIA_TRANSIT,
    'belarus-transit-visa': BELARUS_TRANSIT,

    // Family Reunion / Dependent Visa
    'georgia-family-reunion-/-dependent-visa': GEORGIA_FAMILY,
    'belarus-family-reunion-/-dependent-visa': BELARUS_FAMILY,
};

export const DEFAULT_CONFIG = normalizeVisaConfig(GEORGIA_STUDENT); // Fallback config
export const VISA_CONFIG_KEYS = Object.keys(VISA_CONFIGS);

/**
 * Helper to get the deterministic key for the VISA_CONFIGS map based on gateway selection.
 */
export function getVisaConfigKey(purpose: string, country: string): string {
    return `${country.toLowerCase()}-${purpose.toLowerCase().replace(/\s+/g, '-')}`;
}

export async function getVisaConfig(purpose: string, country: string): Promise<VisaConfig> {
    if (!purpose || !country) return DEFAULT_CONFIG;
    const key = getVisaConfigKey(purpose, country);

    // 1. Prefer admin-defined published configs from the store
    try {
        const stored = await visaConfigStoreService.getByKey(key);
        if (stored && stored.status === 'published') {
            return normalizeVisaConfig(stored);
        }
    } catch (e) {
        console.error('Failed to load visa config from store', e);
    }

    // 2. Fallback to static code-defined configs
    return normalizeVisaConfig(VISA_CONFIGS[key] ?? DEFAULT_CONFIG);
}
