"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { Button } from '@/components/portal/Button';
import { Search, UploadCloud, ArrowRight, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type AgentUploadListItem = {
    id: string;
    status: string;
    purpose?: string | null;
    updatedAt?: string | null;
    applicant?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    } | null;
};

type AgentVerificationDoc = {
    type: 'BUSINESS_REGISTRATION' | 'TAX_PAN' | 'IDENTITY_DOCUMENT';
};

export default function AgentUploadSelectionPage() {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<AgentUploadListItem[]>([]);
    const [myDocs, setMyDocs] = useState<AgentVerificationDoc[]>([]);

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/applications');
            const data = await res.json().catch(() => ({}));
            setItems(Array.isArray(data?.items) ? data.items : []);
        }
        load();
    }, []);

    useEffect(() => {
        async function loadMyDocs() {
            const userId = (session?.user as { id?: string } | undefined)?.id;
            if (!userId) return;
            const res = await fetch(`/api/agents/${encodeURIComponent(userId)}/documents`);
            const data = await res.json().catch(() => ({}));
            setMyDocs(Array.isArray(data?.items) ? data.items : []);
        }
        void loadMyDocs();
    }, [session]);

    const actionableApplicants = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return items.filter((app) => {
            const status = String(app.status || '');
            const name = `${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.toLowerCase();
            const id = String(app?.id || '').toLowerCase();
            return (status === 'PENDING' || status === 'UNDER_REVIEW') && (name.includes(s) || id.includes(s));
        });
    }, [items, searchTerm]);

    const recentActivity = useMemo(() => {
        return [...items]
            .sort((a, b) => String(b?.updatedAt || '').localeCompare(String(a?.updatedAt || '')))
            .slice(0, 4)
            .map((app) => {
                const applicantName = `${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.trim() || app?.applicant?.email || 'Applicant';
                const status = String(app?.status || '').replace(/_/g, ' ') || 'Updated';
                const time = app?.updatedAt ? new Date(app.updatedAt).toLocaleString() : '-';
                return {
                    id: app.id,
                    user: applicantName,
                    action: `Application ${status}`,
                    time,
                };
            });
    }, [items]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Document Management</h1>
                <p className="text-gray-500 font-medium">Select an applicant to manage their document uploads.</p>
            </div>

            <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#C6A96A]" /> My Verification Documents
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Upload or update your company registration, tax PAN, and identity document.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
                            Uploaded: {myDocs.length}/3
                        </span>
                        <Link href="/portal/agent/upload-documents/self">
                            <Button className="whitespace-nowrap">Manage My Documents</Button>
                        </Link>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-6 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by client name or ID..."
                            className="w-full pl-10 pr-4 py-2 bg-[#F6F8FB] border-transparent focus:bg-white focus:border-[#C6A96A] focus:ring-4 focus:ring-[#C6A96A]/5 rounded-xl transition-all outline-none text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        {actionableApplicants.length > 0 ? (
                            actionableApplicants.map(app => (
                                <Link key={app.id} href={`/portal/agent/upload-documents/${app.id}`}>
                                    <div className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#C6A96A]/30 hover:bg-[#C6A96A]/5 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[#C6A96A] font-bold shadow-sm">
                                                {(`${app?.applicant?.firstName || 'A'}`).charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 group-hover:text-[#C6A96A] transition-colors">{(`${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`).trim() || 'Applicant'}</p>
                                                <p className="text-xs text-gray-500 font-medium">{app.id} • {app.purpose} Visa</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${String(app.status) === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-[#C6A96A] border border-blue-100'}`}>
                                                {String(app.status).replace(/_/g, ' ')}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#C6A96A] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-500">No matching applicants found.</p>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-[#C6A96A] to-[#A88B4A] text-white border-0 shadow-lg shadow-[#C6A96A]/20">
                        <UploadCloud className="w-8 h-8 mb-4 opacity-80" />
                        <h3 className="text-lg font-bold mb-2">Bulk Upload Mode</h3>
                        <p className="text-sm text-white/80 leading-relaxed mb-6">Coming soon: Upload documents for multiple applications in a single workflow.</p>
                        <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 font-bold">
                            View Roadmap
                        </Button>
                    </Card>

                    <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-900">{item.user}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{item.action} • {item.time}</span>
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <div className="text-xs text-gray-500 font-medium">No activity yet.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
