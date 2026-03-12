import React from 'react';

export function StatusBadge({ status }: { status: string }) {
    let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
    let dotClass = 'bg-gray-400';

    const normalized = status.toLowerCase().replace(/_/g, ' ').trim();

    switch (normalized) {
        case 'pending':
            colorClass = 'bg-[#D4A857]/10 text-[#D4A857] border-[#D4A857]/30';
            dotClass = 'bg-[#D4A857]';
            break;
        case 'under review':
            colorClass = 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30';
            dotClass = 'bg-[#3B82F6]';
            break;
        case 'requires info':
            colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
            dotClass = 'bg-amber-500';
            break;
        case 'accepted':
        case 'success':
        case 'active':
            colorClass = 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30';
            dotClass = 'bg-[#2E8B57]';
            break;
        case 'rejected':
        case 'failed':
        case 'inactive':
            colorClass = 'bg-[#C44545]/10 text-[#C44545] border-[#C44545]/30';
            dotClass = 'bg-[#C44545]';
            break;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass} tracking-wide`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
            {status}
        </span>
    );
}
