import React from 'react';

interface TableProps {
    columns: string[];
    children: React.ReactNode;
    className?: string;
}

export function Table({ columns, children, className = '' }: TableProps) {
    return (
        <div className={`w-full overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm ${className}`}>
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-[#F6F8FB]/80 text-gray-500 uppercase font-semibold text-xs border-b border-gray-100">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className="px-6 py-4 tracking-wider whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {children}
                </tbody>
            </table>
        </div>
    );
}

export function TableRow({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <tr className={`hover:bg-[#F6F8FB]/50 transition-colors group ${className}`}>
            {children}
        </tr>
    );
}

export function TableCell({ children, className = '', colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) {
    return (
        <td className={`px-6 py-4 whitespace-nowrap ${className}`} colSpan={colSpan}>
            {children}
        </td>
    );
}
