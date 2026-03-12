"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  MessageSquare,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';

import { Card } from '@/components/portal/Card';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Button } from '@/components/portal/Button';
import { formatAgentRef, formatApplicationRef } from '@/lib/displayId';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'REQUIRES_INFO' | 'APPROVED' | 'REJECTED';
type DocumentStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';

const REQUEST_INFO_SUBJECT_OPTIONS = [
  'Action Required: Additional Information Needed',
  'Action Required: Please find the attachment for more information.',
];

type ApplicationDetail = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  agentId?: string | null;
  purpose?: string | null;
  destinationCountry?: string | null;
  formData?: Record<string, unknown>;
  error?: string;
  applicant?: {
    id: string;
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
    transactionId?: string | null;
    createdAt: string;
  }>;
  statusHistory?: Array<{
    id: string;
    status: ApplicationStatus;
    note?: string | null;
    createdAt: string;
  }>;
  messages?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
};

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

function extractFirstUrl(value?: string | null) {
  if (!value) return null;
  const match = value.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

function removeUrls(value?: string | null) {
  if (!value) return '';
  return value.replace(/https?:\/\/[^\s]+/gi, '').replace(/\s+/g, ' ').trim();
}

function calculateAge(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDelta = now.getMonth() - d.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export default function AdminApplicationDetailPage({ params }: { params: { id: string } }) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestSubject, setRequestSubject] = useState(REQUEST_INFO_SUBJECT_OPTIONS[0]);
  const [requestMessage, setRequestMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [acceptReason, setAcceptReason] = useState('');
  const [rejectLetterFile, setRejectLetterFile] = useState<File | null>(null);
  const [acceptLetterFile, setAcceptLetterFile] = useState<File | null>(null);
  const [requestInfoLetterFile, setRequestInfoLetterFile] = useState<File | null>(null);

  const loadApplication = useCallback(async () => {
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
    void loadApplication();
  }, [loadApplication]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const appId = params.id;

    const channel = supabase
      .channel(`admin-app-${appId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Application', filter: `id=eq.${appId}` },
        () => {
          void loadApplication();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Document', filter: `applicationId=eq.${appId}` },
        () => {
          void loadApplication();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Payment', filter: `applicationId=eq.${appId}` },
        () => {
          void loadApplication();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'StatusHistory', filter: `applicationId=eq.${appId}` },
        () => {
          void loadApplication();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Message', filter: `applicationId=eq.${appId}` },
        () => {
          void loadApplication();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadApplication, params.id]);

  const formData = useMemo(() => asRecord(application?.formData), [application?.formData]);

  const applicantName = useMemo(() => {
    const fromForm = `${firstFilled(formData, ['firstName'])} ${firstFilled(formData, ['lastName'])}`.trim();
    if (fromForm) return fromForm;
    const a = application?.applicant;
    return `${a?.firstName || ''} ${a?.lastName || ''}`.trim() || a?.email || 'Applicant';
  }, [application?.applicant, formData]);

  const passportNumber = firstFilled(formData, ['passportNumber', 'passportNo', 'passport_number']);
  const dobRaw = firstFilled(formData, ['dob', 'dateOfBirth', 'birthDate']);
  const age = dobRaw ? calculateAge(dobRaw) : null;
  const email = firstFilled(formData, ['email']) || application?.applicant?.email || '-';
  const phone = firstFilled(formData, ['phone']) || application?.applicant?.phone || '-';

  const documents = useMemo(
    () => (Array.isArray(application?.documents) ? application.documents : []),
    [application?.documents]
  );
  const submittedFormPdf = useMemo(
    () => documents.find((doc) => doc.documentId === 'submitted-form-pdf') || null,
    [documents]
  );
  const reviewableDocuments = useMemo(
    () => documents.filter((doc) => doc.documentId !== 'submitted-form-pdf'),
    [documents]
  );
  const payments = useMemo(
    () => (Array.isArray(application?.payments) ? application.payments : []),
    [application?.payments]
  );
  const statusHistory = useMemo(
    () => (Array.isArray(application?.statusHistory) ? application.statusHistory : []),
    [application?.statusHistory]
  );
  const emailableDocuments = useMemo(() => {
    const items = [
      ...(submittedFormPdf?.fileUrl
        ? [{ label: submittedFormPdf.name || 'Submitted Form PDF', fileUrl: submittedFormPdf.fileUrl }]
        : []),
      ...reviewableDocuments
        .filter((doc) => Boolean(doc.fileUrl))
        .map((doc) => ({
          label: doc.name || doc.documentId,
          fileUrl: doc.fileUrl as string,
        })),
    ];

    return items;
  }, [reviewableDocuments, submittedFormPdf]);
  const emailFilesHref = useMemo(() => {
    if (!application?.applicant?.email || emailableDocuments.length === 0) return null;

    const subject = `Application Files for ${applicantName}`;
    const lines = [
      `Hello ${applicantName},`,
      '',
      `Please find the available file links for application ${application.id}:`,
      '',
      ...emailableDocuments.map((doc, index) => `${index + 1}. ${doc.label}: ${doc.fileUrl}`),
      '',
      'Regards,',
      'GGBA Admin',
    ];

    return `mailto:${encodeURIComponent(application.applicant.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }, [applicantName, application?.applicant?.email, application?.id, emailableDocuments]);

  const latestPayment = useMemo(() => {
    if (payments.length === 0) return null;
    return [...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }, [payments]);

  const verifiedDocs = reviewableDocuments.filter((doc) => doc.status === 'VERIFIED').length;
  const pendingDocs = reviewableDocuments.filter((doc) => doc.status !== 'VERIFIED').length;
  const rejectedDocs = reviewableDocuments.filter((doc) => doc.status === 'REJECTED').length;
  const verificationRate = reviewableDocuments.length > 0 ? Math.round((verifiedDocs / reviewableDocuments.length) * 100) : 0;

  const riskLabel = rejectedDocs > 0 ? 'HIGH' : pendingDocs > 0 ? 'MEDIUM' : 'LOW';
  const riskTextClass =
    riskLabel === 'HIGH' ? 'text-rose-700 bg-rose-50 border-rose-200' : riskLabel === 'MEDIUM' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  const updateStatus = async (
    status: ApplicationStatus,
    note?: string,
    notifyApplicant?: boolean,
    options?: { decisionLetter?: File | null; subject?: string }
  ) => {
    setIsUpdatingStatus(true);
    try {
      const letterFile = options?.decisionLetter || null;
      const requestInit: RequestInit = letterFile
        ? (() => {
            const form = new FormData();
            form.set('status', status);
            if (note) form.set('note', note);
            if (options?.subject) form.set('subject', options.subject);
            form.set('notifyApplicant', String(Boolean(notifyApplicant)));
            form.set('decisionLetter', letterFile);
            return { method: 'PATCH', body: form };
          })()
        : {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              status,
              note,
              subject: options?.subject,
              notifyApplicant: Boolean(notifyApplicant),
            }),
          };

      const res = await fetch(`/api/applications/${encodeURIComponent(params.id)}/status`, requestInit);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update status');
      }
      await loadApplication();
    } catch (e) {
      console.error(e);
      const message = e instanceof Error && e.message ? e.message : 'Failed to update application status.';
      alert(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateDocumentStatus = async (
    documentId: string,
    status: DocumentStatus,
    note?: string
  ) => {
    setUpdatingDocId(documentId);
    try {
      const res = await fetch(
        `/api/applications/${encodeURIComponent(params.id)}/documents/${encodeURIComponent(documentId)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status, note }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update document');
      }

      await loadApplication();
    } catch (e) {
      console.error(e);
      alert('Failed to update document status.');
    } finally {
      setUpdatingDocId(null);
    }
  };

  const onDecisionLetterChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    mode: 'accept' | 'reject' | 'request'
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      if (mode === 'accept') setAcceptLetterFile(null);
      else if (mode === 'reject') setRejectLetterFile(null);
      else setRequestInfoLetterFile(null);
      return;
    }

    const type = (file.type || '').toLowerCase();
    const isPdf = type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      alert('Please upload a PDF letter.');
      event.target.value = '';
      return;
    }

    if (mode === 'accept') setAcceptLetterFile(file);
    else if (mode === 'reject') setRejectLetterFile(file);
    else setRequestInfoLetterFile(file);
  };

  const resetRequestInfoModal = () => {
    setShowRequestInfoModal(false);
    setRequestSubject(REQUEST_INFO_SUBJECT_OPTIONS[0]);
    setRequestMessage('');
    setRequestInfoLetterFile(null);
  };

  if (isLoading || !application || application?.error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link
          href="/portal/admin/applications"
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#C6A96A] mb-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Applications
        </Link>
        <Card className="p-8 border-0 ring-1 ring-gray-200 shadow-sm">
          <p className="text-gray-600 font-semibold">Loading application...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link
        href="/portal/admin/applications"
        className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#C6A96A] mb-2 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Applications
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{applicantName}</h1>
            <StatusBadge status={String(application.status).replace(/_/g, ' ')} />
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
            <span>ID: {formatApplicationRef(application.id)}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
            <span>Applied: {formatDate(application.createdAt)}</span>
            {application.agentId && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                <span className="text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 uppercase tracking-widest text-[10px] font-bold">
                  Agent: {formatAgentRef(application.agentId)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0 bg-white p-2.5 rounded-2xl ring-1 ring-gray-200 shadow-sm border border-gray-50">
          {emailFilesHref && (
            <a
              href={emailFilesHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
            >
              <ExternalLink className="w-4 h-4" /> Email File Links
            </a>
          )}
          <Button
            variant="outline"
            onClick={() => setShowRequestInfoModal(true)}
            className="flex-1 md:flex-none justify-center gap-2 border-amber-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900 font-bold"
          >
            <MessageSquare className="w-4 h-4" /> Request Info
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectModal(true)}
            className="flex-1 md:flex-none justify-center gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold"
          >
            <XCircle className="w-4 h-4" /> REJECT
          </Button>
          <Button
            disabled={isUpdatingStatus}
            onClick={() => setShowAcceptModal(true)}
            className="flex-1 md:flex-none justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] ring-0 border-0 text-white font-bold ml-1 disabled:opacity-70"
          >
            <CheckCircle2 className="w-4 h-4" /> ACCEPT
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 bg-[#F6F8FB]/80 border-b border-gray-100 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              <h2 className="font-bold text-gray-900 tracking-tight">Applicant Details</h2>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</p>
                <p className="font-bold text-gray-900 text-base">{applicantName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Contact Method</p>
                <p className="font-semibold text-gray-900 text-sm">{email}</p>
                <p className="text-gray-500 text-sm mt-0.5 font-medium">{phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Assigned Visa Category</p>
                <p className="font-black text-[#C6A96A] text-base uppercase tracking-wider bg-blue-50 inline-block px-3 py-1 rounded-md border border-blue-100">
                  {application.purpose || '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Destination Country</p>
                <p className="font-bold text-gray-900 text-base">{application.destinationCountry || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Passport Number</p>
                <p className="font-bold text-gray-900 text-base tracking-wider bg-[#F6F8FB] inline-block px-3 py-1 rounded-md border border-gray-200 shadow-inner">
                  {passportNumber || '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date of Birth</p>
                <p className="font-bold text-gray-900 text-base">
                  {dobRaw ? formatDate(dobRaw) : '-'}
                  {age !== null && (
                    <span className="text-gray-400 font-bold text-sm ml-1.5 bg-gray-100 px-2 py-0.5 rounded-full">
                      ({age} yrs)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-0 border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden bg-white">
            <div className="p-5 border-b border-gray-100 bg-emerald-50/40">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Submitted Form</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Full submitted form is generated as PDF at submission time.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {submittedFormPdf?.fileUrl ? (
                    <a
                      href={submittedFormPdf.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-2"
                    >
                      <FileText className="w-4 h-4" />
                      Open Submitted Form PDF
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500">
                      PDF will be available after submission.
                    </span>
                  )}
                  {documents.some((doc) => doc.fileUrl) && (
                    <a
                      href={`/api/applications/${encodeURIComponent(application.id)}/documents-zip`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#C6A96A]/30 bg-white px-3 py-2 text-sm font-bold text-[#C6A96A] transition-colors hover:bg-amber-50"
                    >
                      <FileText className="w-4 h-4" />
                      Download ZIP
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5 bg-[#F6F8FB]/80 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h2 className="font-bold text-gray-900 tracking-tight">Document Verification</h2>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest shadow-sm">
                {pendingDocs} Pending
              </span>
            </div>

            <div className="p-0 divide-y divide-gray-100">
              {reviewableDocuments.length === 0 && (
                <div className="p-5 text-sm text-gray-500 font-medium">No documents uploaded yet.</div>
              )}

              {reviewableDocuments.map((doc) => {
                const isBusy = updatingDocId === doc.documentId;
                const statusLabel = String(doc.status || 'PENDING').replace(/_/g, ' ');
                const statusTone =
                  doc.status === 'VERIFIED'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : doc.status === 'REJECTED'
                      ? 'text-rose-700 bg-rose-50 border-rose-100'
                      : 'text-amber-700 bg-amber-50 border-amber-100';

                return (
                  <div key={doc.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#F6F8FB] transition-colors">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 text-sm">{doc.name || doc.documentId}</p>
                      <p className="text-xs text-gray-500 font-medium">ID: {doc.documentId}</p>
                      <p className="text-xs text-gray-400">Updated: {formatDateTime(doc.updatedAt)}</p>
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#C6A96A] hover:underline"
                        >
                          Open File
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400">No file link</p>
                      )}
                      {doc.verificationNote && (
                        <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 inline-block">
                          Note: {doc.verificationNote}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md border uppercase tracking-widest ${statusTone}`}>
                        {statusLabel}
                      </span>

                      {doc.status !== 'VERIFIED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => updateDocumentStatus(doc.documentId, 'VERIFIED')}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Verify
                        </Button>
                      )}

                      {doc.status !== 'REJECTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => {
                            const note = window.prompt('Rejection note (optional):', doc.verificationNote || '');
                            if (note === null) return;
                            void updateDocumentStatus(doc.documentId, 'REJECTED', note || undefined);
                          }}
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          Reject
                        </Button>
                      )}

                      {doc.status !== 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => updateDocumentStatus(doc.documentId, 'PENDING')}
                        >
                          Mark Pending
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gray-500" /> Verification Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-600">Verified Documents</span>
                <span className="font-black text-gray-900">
                  {verifiedDocs} / {reviewableDocuments.length}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${verificationRate}%` }}></div>
              </div>
              <div className={`text-xs font-bold px-3 py-2 rounded-md border inline-flex ${riskTextClass}`}>
                Risk Level: {riskLabel}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pending review: {pendingDocs}. Rejected: {rejectedDocs}. Messages: {(application.messages || []).length}.
              </p>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 mb-5 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" /> Financial Dashboard
            </h3>
            <div className="flex flex-col gap-1 mb-6 bg-[#F6F8FB] p-4 rounded-xl border border-gray-100">
              <span className="text-3xl font-black text-gray-900">
                €{latestPayment ? Number(latestPayment.amount).toFixed(2) : '0.00'}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Latest Payment</span>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-400 uppercase tracking-widest">Payment Status</span>
                <StatusBadge
                  status={
                    latestPayment
                      ? (String(latestPayment.status).toLowerCase() === 'completed' ? 'Success' : String(latestPayment.status))
                      : 'Pending'
                  }
                />
              </div>
              <div className="flex justify-between items-center text-xs border-t border-dashed border-gray-100 pt-3">
                <span className="font-bold text-gray-400 uppercase tracking-widest">Transaction ID</span>
                <span className="font-bold text-gray-900">{latestPayment?.transactionId || latestPayment?.id || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-dashed border-gray-100 pt-3">
                <span className="font-bold text-gray-400 uppercase tracking-widest">Payment Method</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {latestPayment?.method || '-'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 mb-4">Recent Status Activity</h3>
            <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
              {statusHistory.length === 0 && <p className="text-sm text-gray-500">No status changes yet.</p>}
              {statusHistory
                .slice()
                .reverse()
                .slice(0, 8)
                .map((entry) => {
                  const letterUrl = extractFirstUrl(entry.note);
                  const noteText = removeUrls(entry.note);
                  return (
                  <div key={entry.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                      {String(entry.status).replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(entry.createdAt)}</p>
                    {noteText && <p className="text-sm text-gray-700 mt-2">{noteText}</p>}
                    {letterUrl && (
                      <a
                        href={letterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-xs font-bold text-[#C6A96A] hover:underline"
                      >
                        View Decision Letter
                      </a>
                    )}
                  </div>
                )})}
            </div>
          </Card>
        </div>
      </div>

      {showRequestInfoModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-amber-50/80">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" /> Request Information
              </h3>
              <button
                onClick={resetRequestInfoModal}
                className="text-amber-300 hover:text-amber-700 transition-colors bg-white rounded-full p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-600 font-medium leading-relaxed bg-[#F6F8FB] p-3 rounded-lg border border-gray-100">
                You are about to send an official system notification to{' '}
                <span className="font-bold text-gray-900">{applicantName}</span>.
              </p>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Subject Line</label>
                <select
                  value={requestSubject}
                  onChange={(e) => setRequestSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 shadow-sm focus:border-[#C6A96A] focus:ring-[#C6A96A] sm:text-sm p-3 bg-white transition-colors"
                >
                  {REQUEST_INFO_SUBJECT_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Detailed Message Body</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#C6A96A] focus:ring-[#C6A96A] sm:text-sm p-4 resize-none bg-[#F6F8FB] focus:bg-white transition-colors leading-relaxed"
                  placeholder="Type your message here..."
                ></textarea>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Upload PDF (optional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onDecisionLetterChange(e, 'request')}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                />
                {requestInfoLetterFile && (
                  <p className="text-xs text-gray-500 font-medium">Selected: {requestInfoLetterFile.name}</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-[#F6F8FB]/80 flex justify-end gap-3 border-t border-gray-100">
              <Button variant="outline" onClick={resetRequestInfoModal} className="px-6 font-bold text-gray-600">
                Cancel
              </Button>
              <Button
                disabled={isUpdatingStatus}
                onClick={async () => {
                  await updateStatus('REQUIRES_INFO', requestMessage || 'Additional information requested.', true, {
                    subject: requestSubject,
                    decisionLetter: requestInfoLetterFile,
                  });
                  resetRequestInfoModal();
                }}
                className="shadow-md px-6 font-bold bg-[#C6A96A] hover:bg-blue-600 disabled:opacity-70"
              >
                Send Notice
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-10 pb-6 text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-100/50 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Accept Application?</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed bg-[#F6F8FB] p-4 rounded-xl border border-gray-100">
                The applicant will receive the acceptance update immediately.
              </p>
            </div>
            <div className="px-8 pb-8 space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Acceptance Note</label>
              <textarea
                value={acceptReason}
                onChange={(e) => setAcceptReason(e.target.value)}
                rows={4}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium bg-[#F6F8FB] px-4 py-3 text-gray-700 outline-none"
                placeholder="Add acceptance note..."
              ></textarea>
              <div className="pt-2 space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Acceptance Letter (PDF, optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onDecisionLetterChange(e, 'accept')}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                />
                {acceptLetterFile && (
                  <p className="text-xs text-gray-500 font-medium px-1">Selected: {acceptLetterFile.name}</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-[#F6F8FB]/80 flex justify-between gap-3 border-t border-gray-100 p-2">
              <Button
                variant="outline"
                className="flex-1 font-bold py-3 hover:bg-gray-100"
                onClick={() => {
                  setShowAcceptModal(false);
                  setAcceptReason('');
                  setAcceptLetterFile(null);
                }}
              >
                Go Back
              </Button>
              <Button
                disabled={isUpdatingStatus}
                className="flex-1 font-bold shadow-lg shadow-emerald-500/30 py-3 bg-emerald-600 hover:bg-emerald-700 ring-0 border-0 disabled:opacity-70"
                onClick={async () => {
                  await updateStatus('APPROVED', acceptReason || 'Accepted by admin', true, {
                    decisionLetter: acceptLetterFile,
                  });
                  setShowAcceptModal(false);
                  setAcceptReason('');
                  setAcceptLetterFile(null);
                }}
              >
                Confirm ACCEPT
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-10 pb-6 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-rose-100/50 shadow-inner">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Reject Application?</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed bg-[#F6F8FB] p-4 rounded-xl border border-gray-100">
                This action is irreversible and the applicant will be notified immediately.
              </p>
            </div>
            <div className="px-8 pb-8 space-y-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 text-sm font-medium bg-[#F6F8FB] px-4 py-3 text-gray-700 outline-none"
                placeholder="Add rejection reason..."
              ></textarea>
              <div className="pt-2 space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Rejection Letter (PDF, optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onDecisionLetterChange(e, 'reject')}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                />
                {rejectLetterFile && (
                  <p className="text-xs text-gray-500 font-medium px-1">Selected: {rejectLetterFile.name}</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-[#F6F8FB]/80 flex justify-between gap-3 border-t border-gray-100 p-2">
              <Button
                variant="outline"
                className="flex-1 font-bold py-3 hover:bg-gray-100"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectLetterFile(null);
                }}
              >
                Go Back
              </Button>
              <Button
                disabled={isUpdatingStatus}
                className="flex-1 font-bold shadow-lg shadow-rose-500/30 py-3 bg-rose-600 hover:bg-rose-700 ring-0 border-0 disabled:opacity-70"
                onClick={async () => {
                  await updateStatus('REJECTED', rejectReason || 'Rejected by admin', true, {
                    decisionLetter: rejectLetterFile,
                  });
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectLetterFile(null);
                }}
              >
                Confirm REJECT
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
