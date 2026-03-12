"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { Clock, FileText, UploadCloud, CreditCard, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { applicationService } from '@/lib/services/applicationService';
import { useRouter } from 'next/navigation';
import { formatApplicationRef } from '@/lib/displayId';

type ApplicationDetail = {
    id: string;
    statusHistory?: Array<{
        id: string;
        status: string;
        note?: string | null;
        createdAt: string;
    }>;
    messages?: Array<{
        id: string;
        content: string;
        isRead?: boolean;
        createdAt: string;
    }>;
};

type ApplicationListItem = {
    id: string;
    status?: string;
    purpose?: string | null;
    destinationCountry?: string | null;
    createdAt?: string;
    updatedAt?: string;
    formData?: Record<string, unknown> | null;
};

const SUBMITTED_AT_KEY = '__submittedAt';

function isSubmittedApplication(app?: ApplicationListItem | null): boolean {
    const formData = app?.formData;
    if (!formData || typeof formData !== 'object') return false;
    return typeof formData[SUBMITTED_AT_KEY] === 'string';
}

function extractFirstUrl(value?: string | null) {
    if (!value) return null;
    const match = value.match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
}

function removeUrls(value?: string | null) {
    if (!value) return '';
    return value.replace(/https?:\/\/[^\s]+/gi, '').replace(/\s+/g, ' ').trim();
}

export default function ApplicantDashboard() {
    const router = useRouter();
    const { data: session } = useSession();
    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [currentDetail, setCurrentDetail] = useState<ApplicationDetail | null>(null);

    useEffect(() => {
        async function load() {
            const list = await applicationService.listApplications();
            setApplications(list);
            const currentId = applicationService.getCurrentApplicationId();
            const selected =
                (currentId && list.some((item) => item.id === currentId) ? currentId : null) ||
                list[0]?.id ||
                null;
            setSelectedApplicationId(selected);
            if (selected) {
                applicationService.setCurrentApplicationId(selected);
            }
        }
        load();
    }, []);

    useEffect(() => {
        const userId = (session?.user as { id?: string } | undefined)?.id;
        if (!userId) return;

        const supabase = createSupabaseBrowserClient();
        const channel = supabase
            .channel('applicant-applications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Application', filter: `applicantId=eq.${userId}` },
                async () => {
                    const list = await applicationService.listApplications();
                    setApplications(list);
                    setSelectedApplicationId((prev) => {
                        const next =
                            (prev && list.some((item) => item.id === prev) ? prev : null) ||
                            list[0]?.id ||
                            null;
                        if (next) applicationService.setCurrentApplicationId(next);
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const currentApp = useMemo(
        () => applications.find((app) => app.id === selectedApplicationId) || applications[0] || null,
        [applications, selectedApplicationId]
    );
    const currentAppId = currentApp?.id as string | undefined;
    const userName = session?.user?.name || 'Applicant';
    const statusLabel = currentApp ? String(currentApp.status || 'PENDING').replace(/_/g, ' ') : 'Pending';
    const currentAppSubmitted = isSubmittedApplication(currentApp);

    const handleOpenApplication = (appId: string) => {
        setSelectedApplicationId(appId);
        applicationService.setCurrentApplicationId(appId);
        router.push('/portal/applicant/application-form');
    };

    const handleApplyNew = () => {
        const hasUnsubmitted = applications.some((app) => !isSubmittedApplication(app));
        if (hasUnsubmitted) {
            alert('You already have an incomplete application draft. Submit or remove it before starting a new one.');
            return;
        }
        applicationService.clearCurrentApplicationId();
        router.push('/portal/applicant/application-form?new=1');
    };

    const handleCancelApplication = async (appId: string) => {
        if (!window.confirm('Remove this incomplete application and form data? This action cannot be undone.')) return;
        await applicationService.cancelApplication(appId);
        const list = await applicationService.listApplications();
        setApplications(list);
        setSelectedApplicationId((prev) => {
            const next =
                (prev && prev !== appId && list.some((item) => item.id === prev) ? prev : null) ||
                list[0]?.id ||
                null;
            if (next) {
                applicationService.setCurrentApplicationId(next);
            } else {
                applicationService.clearCurrentApplicationId();
            }
            return next;
        });
    };

    useEffect(() => {
        async function loadDetail() {
            if (!currentAppId) {
                setCurrentDetail(null);
                return;
            }
            const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}`);
            const data = await res.json().catch(() => null);
            setCurrentDetail(data);
        }
        void loadDetail();
    }, [currentAppId]);

    useEffect(() => {
        if (!currentAppId) return;
        const supabase = createSupabaseBrowserClient();
        const channel = supabase
            .channel(`applicant-dashboard-${currentAppId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Application', filter: `id=eq.${currentAppId}` },
                async () => {
                    const [appsRes, detailRes] = await Promise.all([
                        fetch('/api/applications'),
                        fetch(`/api/applications/${encodeURIComponent(currentAppId)}`),
                    ]);
                    const appsData = await appsRes.json().catch(() => ({}));
                    const detailData = await detailRes.json().catch(() => null);
                    setApplications(Array.isArray(appsData?.items) ? appsData.items : []);
                    setCurrentDetail(detailData);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'StatusHistory', filter: `applicationId=eq.${currentAppId}` },
                async () => {
                    const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}`);
                    const data = await res.json().catch(() => null);
                    setCurrentDetail(data);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Message', filter: `applicationId=eq.${currentAppId}` },
                async () => {
                    const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}`);
                    const data = await res.json().catch(() => null);
                    setCurrentDetail(data);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentAppId]);

    const notifications = useMemo(() => {
        const statusEvents = (currentDetail?.statusHistory || []).map((entry) => ({
            id: `status-${entry.id}`,
            title: `Status updated: ${String(entry.status).replace(/_/g, ' ')}`,
            message: entry.note || 'Your application status has changed.',
            dateIso: entry.createdAt,
            read: false,
        }));

        const messageEvents = (currentDetail?.messages || []).map((entry) => ({
            id: `message-${entry.id}`,
            title: 'New message',
            message: entry.content,
            dateIso: entry.createdAt,
            read: Boolean(entry.isRead),
        }));

        return [...statusEvents, ...messageEvents]
            .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
            .slice(0, 6)
            .map((item) => ({
                id: item.id,
                title: item.title,
                message: removeUrls(item.message),
                linkUrl: extractFirstUrl(item.message),
                date: new Date(item.dateIso).toLocaleString(),
                read: item.read,
            }));
    }, [currentDetail]);

    const nextSteps = [
        { title: 'Apply', description: 'Start a new visa application form.', icon: <FileText className="w-5 h-5 text-[#0F1B2D]" />, href: '/portal/applicant/application-form?new=1', bg: 'bg-[#F6F8FB]', onClick: handleApplyNew },
        { title: 'Upload Documents', description: 'Passport, photos, and supporting files by application.', icon: <UploadCloud className="w-5 h-5 text-[#0F1B2D]" />, href: '/portal/applicant/upload-documents', bg: 'bg-[#F6F8FB]' },
        { title: 'Payment', description: 'Complete your payment to submit application.', icon: <CreditCard className="w-5 h-5 text-[#C6A96A]" />, href: '/portal/applicant/payment', bg: 'bg-[#F6F8FB]' },
        { title: 'Book Appointment', description: 'Schedule your visa appointment.', icon: <Calendar className="w-5 h-5 text-[#0F1B2D]" />, href: '/portal/applicant/booking', bg: 'bg-[#F6F8FB]' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-[#0F1B2D] to-[#16263D] rounded-2xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Welcome back, {userName}!</h1>
                    <p className="text-white/80 max-w-xl text-lg font-medium">
                        Track your visa application progress, upload missing documents, and stay updated.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Application Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Selected Application</h2>
                                <p className="text-sm text-gray-500 mt-1">Application ID: {formatApplicationRef(currentApp?.id)}</p>
                            </div>
                            <StatusBadge status={statusLabel} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-[#F6F8FB] rounded-xl border border-gray-100 mb-6">
                            <div>
                                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Visa Type</p>
                                <p className="font-semibold text-gray-900">{currentApp?.purpose || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Destination</p>
                                <p className="font-semibold text-gray-900">{currentApp?.destinationCountry || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Date Applied</p>
                                <p className="font-semibold text-gray-900">{currentApp?.createdAt ? new Date(currentApp.createdAt).toLocaleDateString() : '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Last Update</p>
                                <p className="font-semibold text-gray-900">{currentApp?.updatedAt ? new Date(currentApp.updatedAt).toLocaleDateString() : '-'}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href="/portal/applicant/status">
                                <Button variant="outline">View Timeline</Button>
                            </Link>
                            <Link href="/portal/applicant/application-form">
                                <Button>{currentAppSubmitted ? 'View Application' : 'Edit Application'}</Button>
                            </Link>
                            {!currentAppSubmitted && currentApp && (
                                <Button variant="outline" onClick={() => handleCancelApplication(currentApp.id)}>
                                    Remove Application
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Your Applications</h2>
                        <div className="space-y-3">
                            {applications.map((app) => (
                                <div
                                    key={app.id}
                                    className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{app.destinationCountry || '-'} - {app.purpose || '-'}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            ID: {formatApplicationRef(app.id)} • Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={String(app.status || 'PENDING').replace(/_/g, ' ')} />
                                        <Button
                                            variant={selectedApplicationId === app.id ? 'primary' : 'outline'}
                                            onClick={() => handleOpenApplication(app.id)}
                                        >
                                            {isSubmittedApplication(app) ? 'View' : 'Edit'}
                                        </Button>
                                        {!isSubmittedApplication(app) && (
                                            <Button variant="outline" onClick={() => handleCancelApplication(app.id)}>
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {applications.length === 0 && (
                                <div className="text-sm text-gray-500">No applications yet.</div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            {nextSteps.map((step, idx) => (
                                <Link
                                    key={idx}
                                    href={step.href}
                                    onClick={(e) => {
                                        if (!step.onClick) return;
                                        e.preventDefault();
                                        step.onClick();
                                    }}
                                    className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-[#C6A96A] hover:shadow-md transition-all group bg-white"
                                >
                                    <div className={`w-12 h-12 rounded-lg ${step.bg} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                                        {step.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-[#C6A96A] transition-colors">{step.title}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#C6A96A] transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
                            <span className="bg-[#C44545]/10 text-[#C44545] text-xs font-bold px-2 py-0.5 rounded-full border border-[#C44545]/20">{notifications.length} New</span>
                        </div>
                        <div className="space-y-5">
                            {notifications.slice(0, 3).map((notif) => (
                                <div key={notif.id} className="relative pl-5 border-l-2 border-gray-100 pb-5 last:pb-0 last:border-0">
                                    <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${notif.read ? 'bg-[#E5EAF2]' : 'bg-[#C44545]'}`}></div>
                                    <h4 className={`text-sm mb-1 ${notif.read ? 'text-gray-700 font-medium' : 'text-gray-900 font-semibold'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{notif.message}</p>
                                    {notif.linkUrl && (
                                        <a
                                            href={notif.linkUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block text-xs font-semibold text-[#C6A96A] hover:underline mb-2"
                                        >
                                            View Letter
                                        </a>
                                    )}
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1 font-semibold">
                                        <Clock className="w-3 h-3" /> {notif.date}
                                    </p>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <div className="text-sm text-gray-500 font-medium">No notifications yet.</div>
                            )}
                        </div>
                        <Link href="/portal/applicant/messages" className="text-[#C6A96A] text-sm font-medium hover:bg-[#F6F8FB] transition-colors flex items-center justify-center mt-4 border border-[#E5EAF2] rounded-lg w-full py-2.5">
                            View all messages
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}
