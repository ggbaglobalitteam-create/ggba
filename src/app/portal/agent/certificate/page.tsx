"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/portal/Button';
import { agentService, AgentProfile } from '@/lib/services/agentService';
import { ArrowLeft, ExternalLink, Printer } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AgentCertificateDocument } from '@/components/portal/AgentCertificateDocument';
import { buildAgentCertificateData } from '@/lib/agentCertificate';

export default function AgentCertificatePage() {
    const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const { data: session, status } = useSession();

    // Add a ref to the printable area
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (status === 'loading') return;
            const userId = (session?.user as { id?: string } | undefined)?.id;
            if (!userId) return;
            const current = await agentService.getAgent(userId);
            setAgentProfile(current);
        };
        loadProfile();
    }, [session, status]);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    if (!agentProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6A96A]"></div>
                <p className="mt-4 text-gray-500">Loading certificate...</p>
            </div>
        );
    }

    if (agentProfile.status !== 'approved') {
        return (
            <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Certificate Unavailable</h2>
                <p className="text-gray-500 mb-6 text-sm">Your agency profile is currently {agentProfile.status}. Certificates are only available for approved agents.</p>
                <Link href="/portal/agent/dashboard">
                    <Button variant="outline" className="w-full font-semibold">Return to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const certificateData = buildAgentCertificateData({
        agentId: agentProfile.id,
        companyName: agentProfile.companyName,
        firstName: agentProfile.firstName,
        lastName: agentProfile.lastName,
        businessRegistrationNo: agentProfile.businessRegistrationNo,
        createdAt: agentProfile.createdAt,
    });
    const styledCertificateUrl =
        typeof window === 'undefined'
            ? `/certificate/agent/${encodeURIComponent(agentProfile.id)}?download=1`
            : `${window.location.origin}/certificate/agent/${encodeURIComponent(agentProfile.id)}?download=1`;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

            {/* Action Bar (Hidden when printing via CSS) */}
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 ${isPrinting ? 'hidden' : ''} print:hidden`}>
                <Link href="/portal/agent/dashboard" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <a
                        href={styledCertificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2E8B57] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#236b43]"
                    >
                        <Printer className="w-4 h-4" /> Open Styled PDF
                    </a>
                    <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 shadow-sm font-semibold">
                        <Printer className="w-4 h-4" /> Print Preview
                    </Button>
                    <a
                        href={styledCertificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#C6A96A]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#1B2340] transition hover:border-[#C6A96A] hover:text-[#C6A96A]"
                    >
                        <ExternalLink className="w-4 h-4" /> Public Download Link
                    </a>
                </div>
            </div>

            {/* Certificate Area */}
            <div ref={printRef} className="print:m-0 print:border-none print:p-0 print:shadow-none">
                <AgentCertificateDocument data={certificateData} qrTargetUrl={styledCertificateUrl} />
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
}
