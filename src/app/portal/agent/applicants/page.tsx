"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { Table, TableRow, TableCell } from '@/components/portal/Table';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { Input } from '@/components/portal/Input';
import { Search, Filter, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { applicationService } from '@/lib/services/applicationService';

type ApplicantListItem = {
    id: string;
    status: string;
    createdAt: string;
    destinationCountry?: string | null;
    purpose?: string | null;
    applicant?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    } | null;
    formData?: Record<string, unknown> | null;
};

const SUBMITTED_AT_KEY = '__submittedAt';

function isSubmittedApplication(app?: ApplicantListItem | null): boolean {
    const formData = app?.formData;
    if (!formData || typeof formData !== 'object') return false;
    return typeof formData[SUBMITTED_AT_KEY] === 'string';
}

export default function AgentApplicantsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<ApplicantListItem[]>([]);

    const reload = async () => {
        const res = await fetch('/api/applications');
        const data = await res.json().catch(() => ({}));
        setItems(Array.isArray(data?.items) ? data.items : []);
    };

    useEffect(() => {
        async function load() {
            await reload();
        }
        load();
    }, []);

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        const channel = supabase
            .channel('agent-applications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Application' },
                async () => {
                    await reload();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filtered = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return items.filter((app) => {
            const name = `${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.toLowerCase();
            const id = String(app?.id || '').toLowerCase();
            const email = String(app?.applicant?.email || '').toLowerCase();
            return name.includes(s) || id.includes(s) || email.includes(s);
        });
    }, [items, searchTerm]);

    const handleCancelApplication = async (appId: string) => {
        if (!window.confirm('Cancel this application draft? This action cannot be undone.')) return;
        await applicationService.cancelApplication(appId);
        await reload();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">My Applicants</h1>
                    <p className="text-gray-500">View and manage all your client applications.</p>
                </div>
                <Link href="/portal/agent/applicants/new">
                    <Button className="flex items-center gap-2 shadow-sm font-semibold hover:shadow-md transition-shadow">
                        <UserPlus className="w-4 h-4" /> Add New Applicant
                    </Button>
                </Link>
            </div>

            <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="w-full sm:w-96 relative">
                        <Input
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search className="w-4 h-4 text-gray-400" />}
                            className="bg-[#F6F8FB] focus:bg-white transition-colors border-transparent focus:border-[#C6A96A]"
                        />
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 bg-white hover:bg-[#F6F8FB] border-gray-200">
                        <Filter className="w-4 h-4" /> Filter Status
                    </Button>
                </div>

                <div className="flex-1">
                    <Table columns={['Applicant Details', 'Visa Details', 'Applied On', 'Status', 'Actions']} className="border-0 shadow-none rounded-none w-full min-w-[800px]">
                        {filtered.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell>
                                    <div className="font-semibold text-gray-900">{`${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.trim() || 'Applicant'}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 font-medium">{app.id}</div>
                                    <div className="text-xs text-gray-400 mt-0.5 group-hover:text-blue-500 transition-colors">{app?.applicant?.email}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-semibold text-gray-700">{app.destinationCountry}</div>
                                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 bg-[#F6F8FB] text-gray-600 text-[11px] font-bold rounded border border-gray-200 uppercase tracking-widest">
                                        {app.purpose}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-600 font-medium">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell><StatusBadge status={String(app.status).replace(/_/g, ' ')} /></TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <Link href={`/portal/agent/applicants/${app.id}`}>
                                            <Button variant="ghost" size="sm" className="w-full justify-start font-semibold text-[#C6A96A] hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all">Manage Application</Button>
                                        </Link>
                                        {!isSubmittedApplication(app) && (
                                            <Link href={`/portal/agent/applicants/new?applicationId=${encodeURIComponent(app.id)}`}>
                                                <Button variant="outline" size="sm" className="w-full justify-start font-semibold text-gray-600 hover:text-[#C6A96A] hover:border-[#C6A96A] transition-all bg-white">Edit Application</Button>
                                            </Link>
                                        )}
                                        <Link href={`/portal/agent/upload-documents/${app.id}`}>
                                            <Button variant="outline" size="sm" className="w-full justify-start font-semibold text-gray-600 hover:text-[#C6A96A] hover:border-[#C6A96A] transition-all bg-white">Manage Documents</Button>
                                        </Link>
                                        {!isSubmittedApplication(app) && (
                                            <Button variant="outline" size="sm" onClick={() => handleCancelApplication(app.id)} className="w-full justify-start font-semibold text-red-600 hover:text-red-700 hover:border-red-400 transition-all bg-white">
                                                Cancel Application
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-16 px-4 bg-[#F6F8FB]/50">
                                    <div className="max-w-xs mx-auto text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <Search className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-gray-900 font-medium mb-1">No applicants found</h3>
                                        <p className="text-gray-500 text-sm">We couldn&apos;t find any applicants matching &quot;{searchTerm}&quot;</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </Table>
                </div>

                <div className="p-4 border-t border-gray-100 bg-[#F6F8FB]/50 flex justify-between items-center text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900 px-1">{filtered.length}</span> results
                </div>
            </Card>
        </div>
    );
}
