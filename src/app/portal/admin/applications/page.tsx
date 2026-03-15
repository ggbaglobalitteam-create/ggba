"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { Table, TableRow, TableCell } from '@/components/portal/Table';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { Input } from '@/components/portal/Input';
import { Search, Filter, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { formatAgentRef, formatApplicationRef } from '@/lib/displayId';

type AdminApplicationItem = {
    id: string;
    createdAt: string;
    destinationCountry?: string | null;
    purpose?: string | null;
    status: string;
    agentId?: string | null;
    formData?: Record<string, unknown> | null;
    applicant?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    } | null;
};

function asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

function firstFilled(formData: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = formData[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
}

export default function AdminApplicationsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [purposeFilter, setPurposeFilter] = useState('all');
    const [items, setItems] = useState<AdminApplicationItem[]>([]);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const loadItems = async () => {
        const res = await fetch('/api/applications');
        const data = await res.json().catch(() => ({}));
        setItems(Array.isArray(data?.items) ? data.items : []);
    };

    useEffect(() => {
        async function load() {
            await loadItems();
        }
        load();
    }, []);

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        const channel = supabase
            .channel('admin-applications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Application' },
                async () => {
                    await loadItems();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const purposeOptions = useMemo(() => {
        const values = new Set<string>();
        items.forEach((item) => {
            const purpose = item.purpose?.trim();
            if (purpose) values.add(purpose);
        });
        return Array.from(values).sort((a, b) => a.localeCompare(b));
    }, [items]);

    const filtered = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return items.filter((app) => {
            const formData = asRecord(app.formData);
            const formName = `${firstFilled(formData, ['firstName'])} ${firstFilled(formData, ['lastName'])}`.trim();
            const fallbackName = `${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.trim();
            const name = (formName || fallbackName).toLowerCase();
            const id = (app?.id || '').toLowerCase();
            const agentId = (app?.agentId || '').toLowerCase();
            const email = (firstFilled(formData, ['email']) || app?.applicant?.email || '').toLowerCase();
            const status = String(app?.status || '').toLowerCase();
            const purpose = String(app?.purpose || '').toLowerCase();
            const matchesSearch = name.includes(s) || id.includes(s) || agentId.includes(s) || email.includes(s);
            const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
            const matchesPurpose = purposeFilter === 'all' || purpose === purposeFilter.toLowerCase();
            return matchesSearch && matchesStatus && matchesPurpose;
        });
    }, [items, purposeFilter, searchTerm, statusFilter]);

    const handleRemoveApplication = async (applicationId: string) => {
        if (!window.confirm('Remove this application? Use this only for inactive/discarded records.')) return;
        setRemovingId(applicationId);
        try {
            const res = await fetch(`/api/applications/${encodeURIComponent(applicationId)}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data?.error || 'Failed to remove application');
                return;
            }
            await loadItems();
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">Master Application List</h1>
                    <p className="text-gray-500">View and moderate all visa applications in the system.</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2 shadow-sm font-semibold border-gray-200">
                    <Download className="w-4 h-4" /> Export CSV
                </Button>
            </div>

            <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-white flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="w-full lg:w-[400px] relative">
                        <Input
                            placeholder="Search by ID, name, or Agent REF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search className="w-4 h-4 text-gray-400" />}
                            className="bg-[#F6F8FB] focus:bg-white transition-colors border-transparent focus:border-[#C6A96A]"
                        />
                    </div>
                    <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 sm:w-40 rounded-lg border-gray-200 shadow-sm focus:border-[#C6A96A] focus:ring-[#C6A96A] text-sm font-semibold bg-white px-3 py-2.5 text-gray-600 outline-none hover:border-gray-300 transition-colors"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="requires_info">Requires Info</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={purposeFilter}
                            onChange={(e) => setPurposeFilter(e.target.value)}
                            className="flex-1 sm:w-40 rounded-lg border-gray-200 shadow-sm focus:border-[#C6A96A] focus:ring-[#C6A96A] text-sm font-semibold bg-white px-3 py-2.5 text-gray-600 outline-none hover:border-gray-300 transition-colors"
                        >
                            <option value="all">All Types</option>
                            {purposeOptions.map((purpose) => (
                                <option key={purpose} value={purpose.toLowerCase()}>
                                    {purpose}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setPurposeFilter('all');
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 bg-white hover:bg-[#F6F8FB] border-gray-200 px-4 py-2.5"
                        >
                            <Filter className="w-4 h-4 text-gray-400" /> Reset Filters
                        </Button>
                    </div>
                </div>

                <div className="flex-1">
                    <Table columns={['App ID', 'Applicant Info', 'Visa Details', 'Agent Ref', 'Status', 'Action']} className="border-0 shadow-none rounded-none w-full min-w-[950px]">
                        {filtered.map((app) => {
                            const formData = asRecord(app.formData);
                            const formName = `${firstFilled(formData, ['firstName'])} ${firstFilled(formData, ['lastName'])}`.trim();
                            const applicantName = formName || `${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.trim() || 'Applicant';
                            const applicantEmail = firstFilled(formData, ['email']) || app?.applicant?.email || '-';

                            return (
                                <TableRow key={app.id}>
                                <TableCell className="font-bold text-gray-900 text-xs tracking-wider">{formatApplicationRef(app.id)}</TableCell>
                                <TableCell>
                                    <div className="font-bold text-gray-900">{applicantName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 font-medium">{applicantEmail}</div>
                                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold hidden sm:block">Applied: {new Date(app.createdAt).toLocaleDateString()}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-semibold text-gray-700">{app.destinationCountry}</div>
                                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 bg-[#F6F8FB] text-gray-600 text-[10px] font-bold rounded border border-gray-200 uppercase tracking-widest">
                                        {app.purpose}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {app.agentId ? (
                                        <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md border border-indigo-100 uppercase tracking-widest cursor-pointer hover:bg-indigo-100 transition-colors tooltip group relative">
                                            {formatAgentRef(app.agentId)}
                                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">Global Visas Ltd</span>
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-bold italic tracking-wider">DIRECT</span>
                                    )}
                                </TableCell>
                                <TableCell><StatusBadge status={String(app.status).replace(/_/g, ' ')} /></TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link href={`/portal/admin/applications/${app.id}`}>
                                            <Button size="sm" className="font-bold shadow-md px-5 bg-gradient-to-r from-[#C6A96A] to-blue-600 hover:from-blue-600 hover:to-blue-700 border-none">Review File</Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRemoveApplication(app.id)}
                                            disabled={removingId === app.id}
                                            className="font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                            {removingId === app.id ? 'Removing...' : 'Remove'}
                                        </Button>
                                    </div>
                                </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 px-4 bg-[#F6F8FB]/50">
                                    <div className="max-w-xs mx-auto text-center">
                                        <div className="w-16 h-16 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <Search className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-gray-900 font-bold mb-1 text-lg">No applications found</h3>
                                        <p className="text-gray-500 text-sm font-medium">Adjust your filters or search term to see more results.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </Table>
                </div>

                <div className="p-4 border-t border-gray-100 bg-[#F6F8FB]/80 flex justify-between items-center text-sm text-gray-500 font-bold tracking-wide">
                    Showing {filtered.length} of {items.length} applications
                </div>
            </Card>
        </div>
    );
}
