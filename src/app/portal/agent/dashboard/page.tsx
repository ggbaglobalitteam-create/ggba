"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { Users, FileCheck, Clock, XCircle, ArrowUpRight, UserPlus, DownloadCloud, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Table, TableRow, TableCell } from '@/components/portal/Table';
import { agentService, AgentProfile, readAgentProfileDraftForIds } from '@/lib/services/agentService';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type AgentApplicationItem = {
    id: string;
    status: string;
    destinationCountry?: string | null;
    purpose?: string | null;
    createdAt: string;
    applicant?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    } | null;
};

export default function AgentDashboard() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [applications, setApplications] = useState<AgentApplicationItem[]>([]);

    useEffect(() => {
        const loadProfile = async () => {
            if (status === 'loading') return;
            const userId = (session?.user as { id?: string } | undefined)?.id;
            if (!userId) {
                router.push('/portal/login');
                return;
            }

            const current = await agentService.getAgent(userId);
            if (!current) {
                setIsLoading(false);
                return;
            }

            const draft = readAgentProfileDraftForIds(current.id, current.userId);
            const hasSubmittedDraft = Boolean(draft?.submitted);

            if (!current.isProfileComplete && !hasSubmittedDraft) {
                router.push('/portal/agent/complete-profile');
                return;
            }

            setAgentProfile(current);

            // Load assigned applications
            const res = await fetch('/api/applications');
            const data = await res.json().catch(() => ({}));
            setApplications(Array.isArray(data?.items) ? data.items : []);

            setIsLoading(false);
        };
        loadProfile();
    }, [router, session, status]);

    const totalApplicants = applications.length;
    const pendingReview = applications.filter(a => (a.status || '').toString() === 'UNDER_REVIEW' || (a.status || '').toString() === 'PENDING').length;
    const approved = applications.filter(a => (a.status || '').toString() === 'APPROVED').length;
    const rejected = applications.filter(a => (a.status || '').toString() === 'REJECTED').length;
    const approvedPct = totalApplicants > 0 ? Math.round((approved / totalApplicants) * 100) : 0;
    const pendingPct = totalApplicants > 0 ? Math.round((pendingReview / totalApplicants) * 100) : 0;
    const rejectedPct = totalApplicants > 0 ? Math.round((rejected / totalApplicants) * 100) : 0;

    const stats = [
        { label: 'Total Applicants', value: totalApplicants, icon: <Users className="w-5 h-5 text-[#0F1B2D]" />, bg: 'bg-[#F6F8FB]' },
        { label: 'Pending Review', value: pendingReview, icon: <Clock className="w-5 h-5 text-[#D4A857]" />, bg: 'bg-[#D4A857]/10' },
        { label: 'Approved Visas', value: approved, icon: <FileCheck className="w-5 h-5 text-[#2E8B57]" />, bg: 'bg-[#2E8B57]/10' },
        { label: 'Rejected', value: rejected, icon: <XCircle className="w-5 h-5 text-[#C44545]" />, bg: 'bg-[#C44545]/10' },
    ];

    useEffect(() => {
        if (!agentProfile) return;
        const supabase = createSupabaseBrowserClient();
        const channel = supabase
            .channel('agent-dashboard-applications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Application' },
                async () => {
                    const res = await fetch('/api/applications');
                    const data = await res.json().catch(() => ({}));
                    setApplications(Array.isArray(data?.items) ? data.items : []);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [agentProfile]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin text-[#C6A96A] mb-4">
                    <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <p className="text-gray-500 font-medium">Loading Dashboard...</p>
            </div>
        );
    }

    if (!agentProfile) {
        return (
            <div className="py-20 text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">We could not locate your agent profile. Please ensure you have completed the registration and setup process.</p>
                <Link href="/portal/agent/complete-profile">
                    <Button className="bg-[#C6A96A] hover:bg-[#B8954F] text-[#0F1B2D] font-semibold">Complete Setup</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Agent Profile Status Banner */}
            {agentProfile.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start sm:items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 sm:mt-0 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-900">Profile Pending Approval</h3>
                        <p className="text-xs text-amber-700 mt-0.5">Your agency profile is currently under review by our team. Some features may be limited until approved.</p>
                    </div>
                </div>
            )}

            {agentProfile.status === 'approved' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-bold text-emerald-900">Profile Approved</h3>
                            <p className="text-xs text-emerald-700 mt-0.5">Your agency profile is fully approved and active.</p>
                        </div>
                    </div>
                    <Link href="/portal/agent/certificate">
                        <Button variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold flex items-center gap-2">
                            <DownloadCloud className="w-4 h-4" /> Download Certificate
                        </Button>
                    </Link>
                </div>
            )}


            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">Agent Overview</h1>
                    <p className="text-gray-500">Manage your applicants and track their visa statuses.</p>
                </div>
                <Link href="/portal/agent/applicants/new">
                    <Button className="flex items-center gap-2 shadow-sm font-semibold">
                        <UserPlus className="w-4 h-4" /> Add Applicant
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="p-6 border-0 shadow-sm ring-1 ring-gray-100/50 hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <span className="text-[#2E8B57] text-[11px] font-bold flex items-center bg-[#2E8B57]/10 px-2 py-0.5 rounded-md border border-[#2E8B57]/20 uppercase tracking-widest">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Applicants</h2>
                        <Link href="/portal/agent/applicants" className="text-sm font-semibold text-[#C6A96A] hover:text-[#096dd9]">View all</Link>
                    </div>
                    <div className="flex-1">
                        <Table columns={['Applicant', 'Visa Type', 'Destination', 'Status', 'Action']} className="border-0 shadow-none rounded-none">
                            {applications.slice(0, 4).map((app) => {
                                const applicantName = `${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.trim() || app?.applicant?.email || 'Applicant';
                                const statusLabel = (app.status || '').toString().replace(/_/g, ' ');
                                return (
                                <TableRow key={app.id}>
                                    <TableCell>
                                        <div className="font-semibold text-gray-900">{applicantName}</div>
                                        <div className="text-xs text-gray-500 mt-0.5 font-medium">{app.id}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 bg-[#F6F8FB] text-gray-700 text-xs font-semibold rounded-md border border-gray-200 uppercase tracking-wider">
                                            {app.purpose}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-medium">{app.destinationCountry}</TableCell>
                                    <TableCell><StatusBadge status={statusLabel} /></TableCell>
                                    <TableCell>
                                        <Link href={`/portal/agent/applicants/${app.id}`}>
                                            <Button variant="ghost" size="sm" className="font-semibold text-[#C6A96A] hover:bg-[#F6F8FB]">View</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </Table>
                    </div>
                </Card>

                <Card className="p-6 border-0 ring-1 ring-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-8">Application Status Distribution</h2>
                    <div className="space-y-7">
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-sm items-end">
                                <span className="font-semibold text-gray-700">Approved</span>
                                <span className="font-bold text-gray-900 text-base">{approved} <span className="text-gray-400 font-medium text-xs ml-1">({approvedPct}%)</span></span>
                            </div>
                            <div className="w-full bg-[#E5EAF2] rounded-full h-2.5 overflow-hidden">
                                <div className="bg-[#2E8B57] h-full rounded-full" style={{ width: `${approvedPct}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex justify-between text-sm items-end">
                                <span className="font-semibold text-gray-700">Pending Review</span>
                                <span className="font-bold text-gray-900 text-base">{pendingReview} <span className="text-gray-400 font-medium text-xs ml-1">({pendingPct}%)</span></span>
                            </div>
                            <div className="w-full bg-[#E5EAF2] rounded-full h-2.5 overflow-hidden">
                                <div className="bg-[#D4A857] h-full rounded-full" style={{ width: `${pendingPct}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex justify-between text-sm items-end">
                                <span className="font-semibold text-gray-700">Rejected</span>
                                <span className="font-bold text-gray-900 text-base">{rejected} <span className="text-gray-400 font-medium text-xs ml-1">({rejectedPct}%)</span></span>
                            </div>
                            <div className="w-full bg-[#E5EAF2] rounded-full h-2.5 overflow-hidden">
                                <div className="bg-[#C44545] h-full rounded-full" style={{ width: `${rejectedPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
