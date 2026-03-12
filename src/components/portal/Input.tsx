import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: string;
    icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', id, ...props }: InputProps) {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    {label} {props.required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className="relative rounded-md shadow-sm">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            block w-full text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl px-4 py-2.5 text-sm shadow-sm transition-all
            focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/20
            disabled:bg-[#F6F8FB] disabled:text-gray-500 disabled:cursor-not-allowed
            ${icon && 'pl-10'}
            ${error ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
        </div>
    );
}
