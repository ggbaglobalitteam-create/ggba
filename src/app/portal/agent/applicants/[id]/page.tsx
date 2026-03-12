"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';

import { Card } from '@/components/portal/Card';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { formatApplicationRef } from '@/lib/displayId';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { applicationService } from '@/lib/services/applicationService';

type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'REQUIRES_INFO' | 'APPROVED' | 'REJECTED';
type DocumentStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';

type ApplicationDetail = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  purpose?: string | null;
  destinationCountry?: string | null;
  formData?: Record<string, unknown>;
  error?: string;
  applicant?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  documents?: Array<{
    id: string;
    documentId: string;
    name: string;
    status: DocumentStatus;
    fileUrl?: string | null;
    verificationNote?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  payments?: Array<{
    id: string;
    amount: number | string;
    status: string;
    method: string;
    createdAt: string;
  }>;
  statusHistory?: Array<{
    id: string;
    status: ApplicationStatus;
    note?: string | null;
    createdAt: string;
  }>;
};

const SUBMITTED_AT_KEY = '__submittedAt';

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function firstFilled(formData: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const raw = formData[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  }
  return '';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

export default function ApplicantDetailPage({ params }: { params: { id: string } }) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'form' | 'documents' | 'payments' | 'timeline'>('overview');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(params.id)}`);
      const data = (await res.json().catch(() => null)) as ApplicationDetail | null;
      setApplication(data);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const appId = params.id;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`agent-app-${appId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Application', filter: `id=eq.${appId}` },
        () => {
          void load();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Document', filter: `applicationId=eq.${appId}` },
        () => {
          void load();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Payment', filter: `applicationId=eq.${appId}` },
        () => {
          void load();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'StatusHistory', filter: `applicationId=eq.${appId}` },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, params.id]);

  const formData = useMemo(() => asRecord(application?.formData), [application?.formData]);
  const isSubmitted = useMemo(() => typeof formData[SUBMITTED_AT_KEY] === 'string', [formData]);
  const currentStepNumber = useMemo(() => {
    const currentStep = formData.currentStep;
    if (typeof currentStep !== 'number' || !Number.isFinite(currentStep) || currentStep < 0) return null;
    return currentStep + 1;
  }, [formData]);
  const applicantName = useMemo(() => {
    const fromForm = `${firstFilled(formData, ['firstName'])} ${firstFilled(formData, ['lastName'])}`.trim();
    if (fromForm) return fromForm;
    const a = application?.applicant;
    return `${a?.firstName || ''} ${a?.lastName || ''}`.trim() || a?.email || 'Applicant';
  }, [application?.applicant, formData]);

  const statusLabel = application ? String(application.status).replace(/_/g, ' ') : 'Pending';
  const documents = useMemo(
    () => (Array.isArray(application?.documents) ? application.documents : []),
    [application?.documents]
  );
  const payments = useMemo(
    () => (Array.isArray(application?.payments) ? application.payments : []),
    [application?.payments]
  );
  const history = useMemo(
    () => (Array.isArray(application?.statusHistory) ? application.statusHistory : []),
    [application?.statusHistory]
  );

  const timelineSteps = useMemo(() => {
    if (history.length === 0 && application?.createdAt) {
      return [
        {
          title: 'Application Submitted',
          date: formatDateTime(application.createdAt),
          status: 'current',
          note: '',
        },
      ];
    }

    return history.map((entry, idx) => ({
      title: String(entry.status).replace(/_/g, ' '),
      date: formatDateTime(entry.createdAt),
      status: idx === history.length - 1 ? 'current' : 'completed',
      note: entry.note || '',
    }));
  }, [application?.createdAt, history]);

  const passportNumber = firstFilled(formData, ['passportNumber', 'passportNo', 'passport_number']);
  const dobValue = firstFilled(formData, ['dob', 'dateOfBirth', 'birthDate']);

  const rejectedDocs = documents.filter((d) => d.status === 'REJECTED');
  const pendingDocs = documents.filter((d) => d.status === 'PENDING' || d.status === 'UPLOADED');

  const actionCard = rejectedDocs.length > 0
    ? {
        title: 'Re-upload Required',
        message: `${rejectedDocs.length} document(s) were rejected. Ask the applicant to upload corrected files.`,
      }
    : pendingDocs.length > 0
      ? {
          title: 'Verification Pending',
          message: `${pendingDocs.length} document(s) are pending verification. Continue document follow-up with applicant.`,
        }
      : {
          title: 'All Clear',
          message: 'All uploaded documents are currently verified.',
        };

  const handleOpenNotifications = () => {
    applicationService.setCurrentApplicationId(params.id);
    window.location.href = '/portal/agent/notifications';
  };

  const handleCancelApplication = async () => {
    if (!application || isSubmitted) return;
    if (!window.confirm('Cancel this application draft? This action cannot be undone.')) return;
    await applicationService.cancelApplication(application.id);
    window.location.href = '/portal/agent/applicants';
  };

  if (isLoading || !application || application?.error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          href="/portal/agent/applicants"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#C6A96A] mb-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Applicants
        </Link>
        <Card className="p-8 border-0 shadow-sm ring-1 ring-gray-200">
          <p className="text-gray-600 font-semibold">Loading application...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/portal/agent/applicants"
        className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#C6A96A] mb-2 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Applicants
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{applicantName}</h1>
            <StatusBadge status={statusLabel} />
          </div>
          <p className="text-gray-500 font-medium tracking-wide">Application ID: {formatApplicationRef(application.id)}</p>
        </div>
        <div className="flex gap-3">
          {!isSubmitted && (
            <Link href={`/portal/agent/applicants/new?applicationId=${encodeURIComponent(application.id)}`}>
              <Button
                variant="outline"
                className="flex items-center gap-2 shadow-sm"
              >
                <FileText className="w-4 h-4" /> Edit Application
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            className="flex items-center gap-2 shadow-sm"
            onClick={handleOpenNotifications}
          >
            <MessageSquare className="w-4 h-4" /> Message Applicant
          </Button>
          <Link href={`/portal/agent/upload-documents/${application.id}`}>
            <Button className="flex items-center gap-2 shadow-md">
              <FileText className="w-4 h-4" /> Manage Documents
            </Button>
          </Link>
          {!isSubmitted && (
            <Button
              variant="outline"
              className="flex items-center gap-2 shadow-sm border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleCancelApplication}
            >
              Cancel Application
            </Button>
          )}
        </div>
      </div>

      <div className="flex p-1 bg-gray-100/80 rounded-lg w-full overflow-x-auto hide-scrollbar mb-6 backdrop-blur-sm shadow-inner">
        {['overview', 'form', 'documents', 'payments', 'timeline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'overview' | 'form' | 'documents' | 'payments' | 'timeline')}
            className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-[#C6A96A] shadow-sm ring-1 ring-gray-200/50'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <Card className="p-0 border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-[#F6F8FB]/50">
                <h2 className="font-bold text-gray-900 tracking-tight">Application Overview</h2>
              </div>
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Visa Category</p>
                  <p className="font-semibold text-gray-900 text-lg">{application.purpose || '-'} Visa</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Destination</p>
                  <p className="font-semibold text-gray-900 text-lg">{application.destinationCountry || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Applied Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(application.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Passport Number</p>
                  <p className="font-semibold text-gray-900">{passportNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date of Birth</p>
                  <p className="font-semibold text-gray-900">{dobValue ? formatDate(dobValue) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Last Update</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(application.updatedAt)}</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'form' && (
            <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 tracking-tight">Application Form</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentStepNumber ? `Draft progress: step ${currentStepNumber}` : 'Draft progress available'}
                  </p>
                </div>
                {!isSubmitted && (
                  <Link href={`/portal/agent/applicants/new?applicationId=${encodeURIComponent(application.id)}`}>
                    <Button className="shadow-sm">Edit / Manage Form</Button>
                  </Link>
                )}
              </div>
              {isSubmitted ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium">
                  This application is submitted. Form editing is locked.
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Open the form to continue, correct, or complete this incomplete application before submission.
                </p>
              )}
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 tracking-tight">Uploaded Documents</h2>
                <Link href={`/portal/agent/upload-documents/${application.id}`}>
                  <Button variant="outline" size="sm" className="shadow-sm font-semibold text-[#C6A96A] border-blue-100 hover:bg-blue-50">
                    Manage Uploads
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-blue-50/30 hover:border-blue-100 transition-all gap-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl shadow-inner bg-blue-50 text-[#C6A96A] border border-blue-100">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 group-hover:text-[#C6A96A] transition-colors">
                          {doc.name || doc.documentId}
                        </p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Updated {formatDate(doc.updatedAt)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{doc.documentId}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 mt-2 md:mt-0">
                      <StatusBadge status={String(doc.status)} />
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-[#C6A96A] hover:bg-blue-50 transition-colors p-2 rounded-lg"
                          title="Open file"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="text-sm text-gray-500 font-medium">No documents uploaded yet.</div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'timeline' && (
            <Card className="p-8 pb-10 border-0 shadow-sm ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900 tracking-tight mb-10 text-xl">Application Timeline</h2>
              <div className="relative pl-7 border-l-2 border-gray-100 space-y-10">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="relative group">
                    <div
                      className={`absolute -left-[35px] top-0 w-4 h-4 rounded-full ring-4 shadow-sm transition-all duration-300 ${
                        step.status === 'completed'
                          ? 'bg-emerald-500 ring-white'
                          : step.status === 'current'
                            ? 'bg-[#C6A96A] ring-blue-50 scale-125'
                            : 'bg-gray-200 ring-white'
                      }`}
                    ></div>
                    <h3
                      className={`font-bold text-base mb-1 transition-colors ${
                        step.status === 'current'
                          ? 'text-[#C6A96A]'
                          : step.status === 'completed'
                            ? 'text-gray-900'
                            : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{step.date}</p>
                    {step.note && <p className="text-sm text-gray-600 mt-2">{step.note}</p>}
                  </div>
                ))}
                {timelineSteps.length === 0 && (
                  <div className="text-sm text-gray-500 font-medium">No timeline events yet.</div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card className="p-0 border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-[#F6F8FB]/50 flex justify-between items-center text-center">
                <h2 className="font-bold text-gray-900 tracking-tight">Payment History</h2>
              </div>
              <div className="p-6 space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-emerald-100 bg-emerald-50/30 rounded-xl shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-base">Payment</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Created {formatDate(payment.createdAt)} • Ref: {payment.id}
                      </p>
                    </div>
                    <div className="text-left sm:text-right mt-3 sm:mt-0">
                      <p className="font-bold text-emerald-600 text-xl">€{Number(payment.amount).toFixed(2)}</p>
                      <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200/50">
                        {String(payment.status)}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="text-sm text-gray-500 font-medium">No payments recorded.</div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#C6A96A] to-indigo-600"></div>
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100 relative z-10 pt-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-1 shadow-lg mb-4">
                <div className="w-full h-full bg-gradient-to-br from-[#C6A96A] to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                  {applicantName.charAt(0)}
                </div>
              </div>
              <h2 className="font-bold text-2xl text-gray-900 tracking-tight mb-1">{applicantName}</h2>
              <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md mt-1 uppercase tracking-widest border border-gray-200">
                Client Profile
              </span>
            </div>
            <div className="pt-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-[#C6A96A] rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="pt-0.5">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email Address</p>
                  <a
                    href={application?.applicant?.email ? `mailto:${application.applicant.email}` : '#'}
                    className="text-sm font-semibold text-gray-900 hover:text-[#C6A96A] transition-colors line-clamp-1"
                  >
                    {application?.applicant?.email || '-'}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="pt-0.5">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Phone Number</p>
                  <a
                    href={application?.applicant?.phone ? `tel:${application.applicant.phone}` : '#'}
                    className="text-sm font-semibold text-gray-900 hover:text-teal-600 transition-colors"
                  >
                    {application?.applicant?.phone || '-'}
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-md ring-1 ring-amber-200 bg-amber-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-bl-full"></div>
            <h3 className="font-bold text-amber-900 text-base mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" /> {actionCard.title}
            </h3>
            <p className="text-sm text-amber-800 font-medium leading-relaxed">{actionCard.message}</p>
            <Link href={`/portal/agent/upload-documents/${application.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-5 bg-white border-amber-200 hover:bg-amber-100 hover:text-amber-900 text-amber-800 font-bold"
              >
                Open Document Manager
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
