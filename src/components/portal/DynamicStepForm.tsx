"use client";

import React from 'react';
import { Input } from './Input';
import { StepConfig, FieldConfig } from '@/types/visa';

interface DynamicStepFormProps {
    stepConfig: StepConfig;
    initialData: Record<string, unknown>;
    onDataChange: (fieldName: string, value: unknown) => void;
    prefilledFields?: string[];
    fieldErrors?: Record<string, string>;
}

export function DynamicStepForm({ stepConfig, initialData, onDataChange, prefilledFields = [], fieldErrors = {} }: DynamicStepFormProps) {
    if (!stepConfig) return null;

    if (stepConfig.fields.length === 0) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 tracking-tight">{stepConfig.title}</h2>
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl text-center text-gray-500 text-sm">
                    This step is handled in the custom step wrapper (e.g. Documents, Review).
                </div>
            </div>
        );
    }

    const prefilledInThisStep = stepConfig.fields.filter(f => prefilledFields.includes(f.name));

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">{stepConfig.title}</h2>

            {prefilledInThisStep.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm text-blue-800 flex items-start gap-3">
                    <span className="text-blue-500 flex-shrink-0 mt-0.5">ℹ️</span>
                    <p>Some fields have been pre-filled from your profile. Please verify and update if needed.</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stepConfig.fields.map((field) => (
                    <div
                        key={field.name}
                        className={[
                            field.type === "section-header" ? "sm:col-span-2" : "",
                            field.wrapperClassName || "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {renderField(field, initialData[field.name] || '', onDataChange, prefilledFields.includes(field.name), fieldErrors[field.name])}
                    </div>
                ))}
            </div>
        </div>
    );
}

const getLabelWithBadge = (label: string, isPrefilled: boolean) => (
    <span className="flex items-center gap-2">
        {label}
        {isPrefilled && (
            <span className="text-[10px] font-semibold bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                from profile
            </span>
        )}
    </span>
);

function renderField(field: FieldConfig, value: unknown, onChange: (name: string, val: unknown) => void, isPrefilled: boolean = false, error?: string) {
    const defaultInputClass = isPrefilled ? 'bg-amber-50/30' : 'bg-white';

    switch (field.type) {
        case 'text':
        case 'number':
        case 'date':
        case 'email':
            return (
                <div className="space-y-1">
                    <Input
                        label={getLabelWithBadge(field.label, isPrefilled)}
                        type={field.type}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={error}
                        value={value}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className={`${field.className || ''} ${defaultInputClass}`}
                    />
                    {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                </div>
            );
        case 'textarea':
            return (
                <div className="space-y-1">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                        {getLabelWithBadge(field.label, isPrefilled)} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <textarea
                        className={`w-full text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl px-4 py-3 text-sm shadow-sm transition-all resize-none min-h-[100px] focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/20 disabled:bg-[#F6F8FB] disabled:text-gray-500 disabled:cursor-not-allowed ${defaultInputClass}`}
                        placeholder={field.placeholder}
                        required={field.required}
                        value={value}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    ></textarea>
                    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
                    {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
                </div>
            );
        case 'select':
            return (
                <div className="space-y-1">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                        {getLabelWithBadge(field.label, isPrefilled)} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                        className={`w-full text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-sm shadow-sm transition-all appearance-none focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/20 disabled:bg-[#F6F8FB] disabled:text-gray-500 disabled:cursor-not-allowed ${defaultInputClass} ${error ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                        required={field.required}
                        value={value}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                    >
                        <option value="" disabled>Select an option</option>
                        {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
                    {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
                </div>
            );
        case 'radio':
            return (
                <div className="space-y-1">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                        {getLabelWithBadge(field.label, isPrefilled)} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <div className={`space-y-2 rounded-xl border border-gray-200 p-3 ${error ? 'border-rose-300' : ''}`}>
                        {(field.options || []).map((opt) => (
                            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="radio"
                                    name={field.name}
                                    checked={String(value) === opt}
                                    onChange={() => onChange(field.name, opt)}
                                    required={field.required}
                                    className="border-gray-300 text-[#C6A96A] focus:ring-[#C6A96A]"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
                    {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
                </div>
            );
        case 'checkbox':
            return (
                <label className={`flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${defaultInputClass} ${error ? 'border-rose-300' : ''}`}>
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(field.name, e.target.checked)}
                        required={field.required}
                        className="mt-1 border-gray-300 text-[#C6A96A] focus:ring-[#C6A96A] rounded"
                    />
                    <div className="text-sm">
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                            {isPrefilled && (
                                <span className="text-[10px] font-semibold bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                    from profile
                                </span>
                            )}
                        </span>
                        {field.helpText && <span className="text-gray-500 block mt-1">{field.helpText}</span>}
                        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
                    </div>
                </label>
            );
        case 'section-header':
            return (
                <div className="pt-6 pb-2 border-b border-gray-100 mb-2 mt-4">
                    <h3 className="text-lg font-bold text-gray-900">{field.label}</h3>
                    {field.helpText && <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>}
                </div>
            );
        default:
            return <div className="text-rose-500">Unsupported field type: {field.type}</div>;
    }
}
