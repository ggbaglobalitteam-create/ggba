"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/portal/Card';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { applicationService } from '@/lib/services/applicationService';

type ApplicationListItem = {
    id: string;
    destinationCountry?: string;
    purpose?: string;
    createdAt?: string;
};

type StatusHistoryItem = {
    status: string;
    note?: string | null;
    createdAt: string;
};

type ApplicationDetail = {
    createdAt?: string;
    statusHistory?: StatusHistoryItem[];
    appointments?: Array<{
        id: string;
        slotDate: string;
        slotTime: string;
        applicantName: string;
        applicantEmail: string;
        passportNumber?: string | null;
        nationality?: string | null;
        createdAt: string;
    }>;
};

type TimelineStep = {
    title: string;
    date: string;
    status: 'current' | 'completed' | 'upcoming';
    note?: string | null;
};

export default function StatusPage() {
    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [application, setApplication] = useState<ApplicationDetail | null>(null);

    useEffect(() => {
        async function loadApps() {
            const list = await applicationService.listApplications();
            setApplications(list);
            const currentId = applicationService.getCurrentApplicationId();
            const selected =
                (currentId && list.some((item) => item.id === currentId) ? currentId : null) ||
                list[0]?.id ||
                null;
            setSelectedApplicationId(selected);
            if (selected) applicationService.setCurrentApplicationId(selected);
        }
        loadApps();
    }, []);

    const currentAppId = selectedApplicationId || (applications[0]?.id as string | undefined);

    useEffect(() => {
        async function loadDetail() {
            if (!currentAppId) return;
            const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}`);
            const data = await res.json().catch(() => null);
            setApplication(data);
        }
        loadDetail();
    }, [currentAppId]);

    useEffect(() => {
        if (!currentAppId) return;
        const supabase = createSupabaseBrowserClient();
        const channel = supabase
            .channel(`applicant-status-${currentAppId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'StatusHistory', filter: `applicationId=eq.${currentAppId}` },
                async () => {
                    const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}`);
                    const data = await res.json().catch(() => null);
                    setApplication(data);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'Application', filter: `id=eq.${currentAppId}` },
                async () => {
                    const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}`);
                    const data = await res.json().catch(() => null);
                    setApplication(data);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentAppId]);

    const timelineSteps = useMemo<TimelineStep[]>(() => {
        const history = Array.isArray(application?.statusHistory) ? application.statusHistory : [];
        if (history.length === 0) {
            return [
                { title: 'Application Submitted', date: application?.createdAt ? new Date(application.createdAt).toLocaleDateString() : '—', status: 'current' },
                { title: 'Under Review', date: 'Pending', status: 'upcoming' },
                { title: 'Final Decision', date: 'Pending', status: 'upcoming' },
            ];
        }

        // Map DB status history into a simple timeline
        return history.map((h, idx) => ({
            title: String(h.status).replace(/_/g, ' '),
            date: new Date(h.createdAt).toLocaleString(),
            status: idx === history.length - 1 ? 'current' : 'completed',
            note: h.note,
        }));
    }, [application]);

    const appointments = Array.isArray(application?.appointments) ? application!.appointments : [];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Application Status Track</h1>
                <p className="text-gray-500">Track the real-time progress of your visa application {currentAppId || ''}.</p>
                {applications.length > 1 && (
                    <div className="mt-4 max-w-sm">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Application</label>
                        <select
                            value={currentAppId || ''}
                            onChange={(e) => {
                                const next = e.target.value;
                                setSelectedApplicationId(next);
                                applicationService.setCurrentApplicationId(next);
                            }}
                            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        >
                            {applications.map((app) => (
                                <option key={app.id} value={app.id}>
                                    {app.destinationCountry} - {app.purpose} ({app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <Card className="p-8 sm:p-12 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
                <div className="relative">
                    {/* Vertical Track background */}
                    <div className="absolute left-[23px] top-6 bottom-6 w-1 bg-gray-100 rounded-full -z-10"></div>

                    <div className="space-y-12">
                        {timelineSteps.map((step, idx) => {
                            const isCompleted = step.status === 'completed';
                            const isCurrent = step.status === 'current';
                            const isUpcoming = step.status === 'upcoming';

                            return (
                                <div key={idx} className="relative flex items-start group">
                                    {/* Vertical active track segment */}
                                    {(isCompleted || isCurrent) && idx !== timelineSteps.length - 1 && (
                                        <div className="absolute left-[23px] top-12 bottom-[-48px] w-1 bg-[#C6A96A] -z-10 transition-all duration-700 shadow-[0_0_10px_rgba(24,144,255,0.5)]"></div>
                                    )}

                                    <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 z-10 shadow-sm
                    ${isCompleted ? 'bg-emerald-500 text-white ring-4 ring-emerald-50 scale-100' : ''}
                    ${isCurrent ? 'bg-white text-[#C6A96A] border-4 border-[#C6A96A] ring-4 ring-blue-50 shadow-blue-500/30 shadow-lg scale-110' : ''}
                    ${isUpcoming ? 'bg-white border-4 border-gray-100 text-gray-300 scale-100' : ''}
                  `}>
                                        {isCompleted && <Check className="w-5 h-5" />}
                                        {isCurrent && <Clock className="w-5 h-5 animate-pulse" />}
                                        {isUpcoming && <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>}
                                    </div>

                                    <div className={`ml-8 sm:ml-10 flex-1 pt-1.5 transition-all duration-300 ${isCurrent ? 'transform translate-x-2' : ''}`}>
                                        <h3 className={`text-lg font-bold tracking-tight mb-1 transition-colors ${isUpcoming ? 'text-gray-400' :
                                                isCurrent ? 'text-[#C6A96A]' : 'text-gray-900'
                                            }`}>
                                            {step.title}
                                        </h3>
                                        <p className={`text-sm font-semibold uppercase tracking-wider ${isUpcoming ? 'text-gray-300' : isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {step.date}
                                        </p>

                                        {isCurrent && (
                                            <div className="mt-5 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 text-blue-800 w-full max-w-xl shadow-inner">
                                                <AlertCircle className="w-6 h-6 text-[#C6A96A] flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium leading-relaxed">{step.note || 'Your application status has been updated.'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            <Card className="p-6 sm:p-8 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Appointments</h2>
                {appointments.length === 0 ? (
                    <p className="text-sm text-gray-500">No appointments booked yet for this application.</p>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((appointment) => (
                            <div key={appointment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="font-semibold text-gray-900">
                                    {new Date(`${appointment.slotDate}T00:00:00`).toLocaleDateString()} at {appointment.slotTime}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Confirmed for {appointment.applicantName} ({appointment.applicantEmail})
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Passport: {appointment.passportNumber || 'N/A'} | Nationality: {appointment.nationality || 'N/A'}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1.5">
                                    Booked on {new Date(appointment.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
