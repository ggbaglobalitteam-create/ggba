"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { FileStack, Clock, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Table, TableRow, TableCell } from '@/components/portal/Table';

type AdminStats = {
    totalApplications: number;
    pendingCount: number;
    revenueThisMonth: number;
    newRegistrationsThisWeek: number;
};

type DashboardApplication = {
    id: string;
    purpose?: string | null;
    status: string;
    applicant?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    } | null;
};

type DashboardPayment = {
    id: string;
    amount: number | string;
    currency: string;
    status: string;
    method: string;
};

export default function AdminDashboard() {
    const [statsData, setStatsData] = useState<AdminStats | null>(null);
    const [recentApps, setRecentApps] = useState<DashboardApplication[]>([]);
    const [recentPayments, setRecentPayments] = useState<DashboardPayment[]>([]);

    useEffect(() => {
        async function load() {
            const [statsRes, appsRes, paymentsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/applications'),
                fetch('/api/payments'),
            ]);
            const statsJson = await statsRes.json().catch(() => null);
            const appsJson = await appsRes.json().catch(() => ({}));
            const payJson = await paymentsRes.json().catch(() => ({}));

            setStatsData(statsJson);
            setRecentApps(Array.isArray(appsJson?.items) ? appsJson.items.slice(0, 5) : []);
            setRecentPayments(Array.isArray(payJson?.items) ? payJson.items.slice(0, 5) : []);
        }
        load();
    }, []);

    const stats = [
        { label: 'Total Applications', value: (statsData?.totalApplications ?? 0).toLocaleString(), icon: <FileStack className="w-5 h-5 text-[#0F1B2D]" />, bg: 'bg-[#F6F8FB]' },
        { label: 'Pending', value: statsData?.pendingCount ?? 0, icon: <Clock className="w-5 h-5 text-[#D4A857]" />, bg: 'bg-[#D4A857]/10' },
        { label: 'Revenue (This Month)', value: `€${Number(statsData?.revenueThisMonth ?? 0).toLocaleString()}`, icon: <TrendingUp className="w-5 h-5 text-[#2E8B57]" />, bg: 'bg-[#2E8B57]/10' },
        { label: 'New Registrations (7d)', value: statsData?.newRegistrationsThisWeek ?? 0, icon: <Users className="w-5 h-5 text-[#C6A96A]" />, bg: 'bg-[#C6A96A]/10' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">System Overview</h1>
                <p className="text-gray-500 font-medium">Global statistics and recent platform activity.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="p-6 border-0 shadow-sm ring-1 ring-gray-200/50 hover:shadow-md transition-all group cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <span className="text-[#2E8B57] text-[11px] font-bold flex items-center bg-[#2E8B57]/10 px-2 py-0.5 rounded-md border border-[#2E8B57]/20 uppercase tracking-widest shadow-sm">
                                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 8%
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">{stat.value}</h3>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Applications */}
                <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Applications</h2>
                        <Link href="/portal/admin/applications" className="text-sm font-semibold text-[#C6A96A] hover:text-[#096dd9]">View all</Link>
                    </div>
                    <div className="flex-1">
                        <Table columns={['App ID', 'Applicant', 'Status', 'Action']} className="border-0 shadow-none rounded-none w-full">
                            {recentApps.map((app) => {
                                const applicantName = `${app?.applicant?.firstName || ''} ${app?.applicant?.lastName || ''}`.trim() || app?.applicant?.email || 'Applicant';
                                const statusLabel = (app.status || '').toString().replace(/_/g, ' ');
                                return (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-bold text-gray-900 text-xs tracking-wider">{app.id}</TableCell>
                                        <TableCell>
                                            <div className="font-bold text-gray-900">{applicantName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 font-medium">{app.purpose} Visa</div>
                                        </TableCell>
                                        <TableCell><StatusBadge status={statusLabel} /></TableCell>
                                        <TableCell>
                                            <Link href={`/portal/admin/applications/${app.id}`}>
                                                <Button variant="ghost" size="sm" className="font-semibold text-[#C6A96A] hover:bg-[#F6F8FB] border border-transparent hover:border-[#E5EAF2] transition-all">Review</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </Table>
                    </div>
                </Card>

                {/* Recent Payments */}
                <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Transactions</h2>
                        <Link href="/portal/admin/payments" className="text-sm font-semibold text-[#C6A96A] hover:text-[#096dd9]">View all</Link>
                    </div>
                    <div className="flex-1">
                        <Table columns={['TXN ID', 'Amount', 'Status', 'Method']} className="border-0 shadow-none rounded-none w-full">
                            {recentPayments.map((pay) => (
                                <TableRow key={pay.id}>
                                    <TableCell className="font-bold text-gray-900 text-xs tracking-wider">{pay.id}</TableCell>
                                    <TableCell>
                                        <div className="font-black text-gray-900">€{Number(pay.amount).toFixed(2)}</div>
                                        <div className="text-[10px] uppercase text-gray-400 font-bold mt-0.5 tracking-widest">EUR</div>
                                    </TableCell>
                                    <TableCell><StatusBadge status={String(pay.status).toLowerCase() === 'completed' ? 'Success' : String(pay.status)} /></TableCell>
                                    <TableCell className="text-gray-600 font-semibold text-sm">{pay.method}</TableCell>
                                </TableRow>
                            ))}
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
