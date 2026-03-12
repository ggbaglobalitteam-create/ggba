/**
 * A safe wrapper around localStorage to ensure SSR compatibility
 * and provide a standardized interface for data persistence.
 */

export const localStorageAdapter = {
    get: <T>(key: string): T | null => {
        if (typeof window === 'undefined') return null;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) as T : null;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage`, error);
            return null;
        }
    },

    save: <T>(key: string, data: T): void => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage`, error);
        }
    },

    remove: (key: string): void => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage`, error);
        }
    },

    // Specific helpers that services will map onto:

    updateField: <T extends Record<string, any>>(key: string, field: keyof T, value: any): void => {
        const currentData = localStorageAdapter.get<T>(key) || {} as T;
        localStorageAdapter.save(key, { ...currentData, [field]: value });
    }
};
