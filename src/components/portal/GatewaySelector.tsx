"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface GatewaySelectorProps {
    onContinue: (purpose: string, country: string, configKey?: string) => void;
    initialCountry?: string;
    initialConfigKey?: string;
}

type CatalogItem = {
    configKey: string;
    country: string;
    purpose: string;
    status: 'DRAFT' | 'PUBLISHED';
};

const FALLBACK_CATALOG: CatalogItem[] = [
    { configKey: 'georgia-student-visa', country: 'Georgia', purpose: 'Student Visa', status: 'PUBLISHED' },
    { configKey: 'belarus-student-visa', country: 'Belarus', purpose: 'Student Visa', status: 'PUBLISHED' },
];

export function GatewaySelector({ onContinue, initialCountry, initialConfigKey }: GatewaySelectorProps) {
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [country, setCountry] = useState('');
    const [configKey, setConfigKey] = useState('');
    const [isCatalogReady, setIsCatalogReady] = useState(false);

    useEffect(() => {
        let active = true;
        async function loadCatalog() {
            let resolved: CatalogItem[] = FALLBACK_CATALOG;
            try {
                const res = await fetch('/api/visa-configs', { cache: 'no-store' });
                if (res.ok) {
                    const body = await res.json();
                    const raw: unknown[] = Array.isArray(body?.catalog) ? body.catalog : [];
                    const published = raw
                        .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
                        .filter((x) => x.status === 'PUBLISHED')
                        .map((x) => ({
                            configKey: String(x.configKey || ''),
                            country: String(x.country || ''),
                            purpose: String(x.purpose || ''),
                            status: 'PUBLISHED' as const
                        }))
                        .filter((x) => x.configKey && x.country && x.purpose)
                        .sort((a, b) => `${a.country}-${a.purpose}`.localeCompare(`${b.country}-${b.purpose}`));

                    if (published.length > 0) {
                        resolved = published;
                    }
                }
            } catch {
                // Keep fallback catalog
            }

            if (!active) return;
            setCatalog(resolved);
            const initialByKey = initialConfigKey
                ? resolved.find((item) => item.configKey === initialConfigKey)
                : null;
            const initialByCountry = initialCountry
                ? resolved.find((item) => item.country === initialCountry)
                : null;
            const defaultSelection = initialByKey || initialByCountry || resolved[0] || null;
            setCountry(defaultSelection?.country || '');
            setConfigKey(defaultSelection?.configKey || '');
            setIsCatalogReady(true);
        }
        void loadCatalog();
        return () => { active = false; };
    }, [initialConfigKey, initialCountry]);

    const countries = useMemo(
        () => Array.from(new Set(catalog.map((x) => x.country))),
        [catalog]
    );

    const purposes = useMemo(
        () => catalog.filter((x) => x.country === country),
        [catalog, country]
    );

    const selected = useMemo(
        () => catalog.find((x) => x.configKey === configKey) || null,
        [catalog, configKey]
    );

    if (!isCatalogReady) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Begin Your Application</h1>
                    <p className="text-gray-500">Loading available visa types...</p>
                </div>
                <Card className="p-10 shadow-sm">
                    <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Begin Your Application</h1>
                <p className="text-gray-500">Select your destination and purpose of travel to customize your form.</p>
            </div>

            <Card className="p-8 shadow-sm space-y-8">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">1. Where are you traveling to?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {countries.map((c) => (
                            <label key={c} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${country === c ? 'border-[#C6A96A] bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-[#C6A96A]'}`}>
                                <input
                                    type="radio"
                                    name="country"
                                    value={c}
                                    checked={country === c}
                                    onChange={() => {
                                        setCountry(c);
                                        const firstPurpose = catalog.find((x) => x.country === c);
                                        if (firstPurpose) setConfigKey(firstPurpose.configKey);
                                    }}
                                    className="mr-3 text-[#C6A96A] focus:ring-[#C6A96A]"
                                />
                                <span className="font-medium text-gray-900">{c}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">2. What is your purpose of travel?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {purposes.map((p) => (
                            <label key={p.configKey} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${configKey === p.configKey ? 'border-[#C6A96A] bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-[#C6A96A]'}`}>
                                <input
                                    type="radio"
                                    name="purpose"
                                    value={p.configKey}
                                    checked={configKey === p.configKey}
                                    onChange={() => setConfigKey(p.configKey)}
                                    className="mt-1 mr-3 text-[#C6A96A] focus:ring-[#C6A96A]"
                                />
                                <span className="text-sm font-medium text-gray-900 leading-tight">{p.purpose}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <Button
                        onClick={() => onContinue(selected?.purpose || '', selected?.country || country, selected?.configKey)}
                        disabled={!selected}
                        className="px-10 shadow-md"
                    >
                        Continue to Application
                    </Button>
                </div>
            </Card>
        </div>
    );
}
