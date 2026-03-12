"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { Table, TableRow, TableCell } from '@/components/portal/Table';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { Input } from '@/components/portal/Input';
import { Search, Download, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

type AdminPaymentItem = {
    id: string;
    createdAt: string;
    applicationId: string;
    amount: number | string;
    currency: string;
    method: string;
    status: string;
    application?: {
        applicant?: {
            email?: string | null;
        } | null;
    } | null;
};

export default function AdminPaymentsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<AdminPaymentItem[]>([]);

    useEffect(() => {
        async function load() {
            const res = await fetch(`/api/payments?search=${encodeURIComponent(searchTerm)}`);
            const data = await res.json().catch(() => ({}));
            setItems(Array.isArray(data?.items) ? data.items : []);
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return items.filter((pay) => {
            const id = String(pay.id || '').toLowerCase();
            const appId = String(pay.applicationId || '').toLowerCase();
            const email = String(pay?.application?.applicant?.email || '').toLowerCase();
            return id.includes(s) || appId.includes(s) || email.includes(s);
        });
    }, [items, searchTerm]);

    const clearedFunds = filtered
        .filter((p) => String(p.status) === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingFunds = filtered
        .filter((p) => String(p.status) === 'PENDING')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const failedFunds = filtered
        .filter((p) => String(p.status) === 'FAILED')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Financial Clearing Dashboard</h1>
                    <p className="text-gray-500 font-medium">Track all secure transactions, refunds, and financial reporting.</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2 shadow-sm font-bold text-[#C6A96A] border-blue-200 hover:bg-blue-50 transition-colors">
                    <Download className="w-4 h-4" /> Export CSV Report
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                <Card className="p-6 border-0 shadow-sm ring-1 ring-emerald-200 bg-emerald-50/80 relative overflow-hidden group cursor-default">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="font-bold text-emerald-900 text-sm tracking-tight text-lg">Cleared Funds</h3>
                        <div className="bg-emerald-100 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                    </div>
                    <p className="text-4xl font-black text-emerald-700 tracking-tight relative z-10">€{clearedFunds.toFixed(2)}</p>
                    <p className="text-[10px] uppercase font-bold text-emerald-600/80 tracking-widest mt-2 relative z-10">Total Verified Revenue</p>
                </Card>

                <Card className="p-6 border-0 shadow-sm ring-1 ring-amber-200 bg-amber-50/80 relative overflow-hidden group cursor-default">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="font-bold text-amber-900 text-sm tracking-tight text-lg">Pending Clearing</h3>
                        <div className="bg-amber-100 p-2 rounded-lg"><CreditCard className="w-5 h-5 text-amber-600" /></div>
                    </div>
                    <p className="text-4xl font-black text-amber-700 tracking-tight relative z-10">€{pendingFunds.toFixed(2)}</p>
                    <p className="text-[10px] uppercase font-bold text-amber-600/80 tracking-widest mt-2 relative z-10">Bank Transfers / Escrow</p>
                </Card>

                <Card className="p-6 border-0 shadow-sm ring-1 ring-rose-200 bg-rose-50/80 relative overflow-hidden group cursor-default">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="font-bold text-rose-900 text-sm tracking-tight text-lg">Disputed / Failed</h3>
                        <div className="bg-rose-100 p-2 rounded-lg"><AlertCircle className="w-5 h-5 text-rose-600" /></div>
                    </div>
                    <p className="text-4xl font-black text-rose-700 tracking-tight relative z-10 mx-auto">€{failedFunds.toFixed(2)}</p>
                    <p className="text-[10px] uppercase font-bold text-rose-600/80 tracking-widest mt-2 relative z-10">Requires immediate attention</p>
                </Card>
            </div>

            <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-white flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="w-full lg:w-[400px] relative">
                        <Input
                            placeholder="Search by exact TXN ID or Applicant REF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search className="w-4 h-4 text-gray-400" />}
                            className="bg-[#F6F8FB] focus:bg-white transition-colors border-transparent focus:border-[#C6A96A] font-medium"
                        />
                    </div>
                    <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap gap-3">
                        <select className="flex-1 sm:w-40 rounded-lg border-gray-200 shadow-sm focus:border-[#C6A96A] focus:ring-[#C6A96A] text-sm font-bold bg-[#F6F8FB] px-3 py-2.5 text-gray-700 outline-none hover:bg-white transition-colors">
                            <option value="all">Time Range: All</option>
                            <option value="today">Today (0)</option>
                            <option value="week">This Week (3)</option>
                            <option value="month">This Month (3)</option>
                        </select>
                        <select className="flex-1 sm:w-40 rounded-lg border-gray-200 shadow-sm focus:border-[#C6A96A] focus:ring-[#C6A96A] text-sm font-bold bg-[#F6F8FB] px-3 py-2.5 text-gray-700 outline-none hover:bg-white transition-colors">
                            <option value="all">Any Status</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed / Reversed</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1">
                    <Table columns={['Transaction Receipt', 'Timestamp', 'Reference Code', 'Net Amount', 'Method / Gateway', 'Final Status']} className="border-0 shadow-none rounded-none w-full min-w-[950px]">
                        {filtered.map((pay) => (
                            <TableRow key={pay.id} className="group">
                                <TableCell className="font-extrabold text-gray-900 text-xs tracking-wider cursor-pointer group-hover:text-[#C6A96A] transition-colors">{pay.id}</TableCell>
                                <TableCell className="text-xs font-bold text-gray-500 tracking-wide uppercase">{new Date(pay.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded inline-block cursor-pointer hover:bg-indigo-100 transition-colors uppercase tracking-widest">{pay.applicationId}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="font-black text-gray-900 text-base">€{Number(pay.amount).toFixed(2)}</div>
                                    <div className="text-[10px] uppercase text-gray-400 font-bold mt-0.5 tracking-widest">EUR</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {pay.method.includes('Card') ? <div className="w-6 h-4 bg-indigo-100 rounded"></div> : <div className="w-6 h-4 bg-teal-100 rounded"></div>}
                                        <span className="font-bold text-gray-800 text-xs">{pay.method}</span>
                                    </div>
                                </TableCell>
                                <TableCell><StatusBadge status={String(pay.status).toLowerCase() === 'completed' ? 'Success' : String(pay.status)} /></TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-24 px-4 bg-[#F6F8FB]/50">
                                    <div className="max-w-xs mx-auto text-center">
                                        <div className="w-20 h-20 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center mx-auto mb-5 text-gray-300">
                                            <CreditCard className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-gray-900 font-black mb-1 text-xl tracking-tight">Financial Records Empty</h3>
                                        <p className="text-gray-500 text-sm font-medium leading-relaxed">No transactions match your current search pattern or filter parameters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </Table>
                </div>
            </Card>
        </div>
    );
}
