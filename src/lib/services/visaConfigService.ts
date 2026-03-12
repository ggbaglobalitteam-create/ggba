import { applicationService } from './applicationService';
import { getVisaConfig } from '../visaConfig';
import { VisaConfig } from '@/types/visa';
import { normalizeVisaConfig, tryNormalizeVisaConfig } from '@/lib/visaConfigSchema';

export const visaConfigService = {
    /**
     * Retrieves the active VisaConfig based on the currently saved Gateway State.
     */
    getActiveConfig: async (applicationId?: string): Promise<VisaConfig | null> => {
        const gatewayState = await applicationService.getGatewayState(applicationId);

        if (gatewayState) {
            // Prefer published override from API, fallback to static configs.
            const key = gatewayState.configKey
                ? gatewayState.configKey
                : `${gatewayState.destinationCountry.toLowerCase()}-${gatewayState.purpose.toLowerCase().replace(/\s+/g, '-')}`;
            try {
                const res = await fetch(`/api/visa-configs/${encodeURIComponent(key)}`);
                if (res.ok) {
                    const item = await res.json();
                    if (item?.status === 'PUBLISHED' && item?.config) {
                        const normalized = tryNormalizeVisaConfig(item.config);
                        if (normalized) return normalized;
                    }
                }
            } catch { }

            return normalizeVisaConfig(
                await getVisaConfig(gatewayState.purpose, gatewayState.destinationCountry)
            );
        }

        return null;
    },

    /**
     * Alias for getActiveConfig with mandatory ID for cleaner agent-side code
     */
    getById: async (applicationId: string): Promise<VisaConfig | null> => {
        return visaConfigService.getActiveConfig(applicationId);
    }
};
