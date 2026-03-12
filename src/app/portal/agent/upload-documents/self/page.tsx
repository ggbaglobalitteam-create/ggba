"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, ExternalLink, ShieldCheck, UploadCloud } from "lucide-react";

import { Card } from "@/components/portal/Card";

type AgentDocumentType = "BUSINESS_REGISTRATION" | "TAX_PAN" | "IDENTITY_DOCUMENT";

type AgentDocumentItem = {
  id: string;
  type: AgentDocumentType;
  label: string;
  fileName: string;
  fileUrl: string;
  status: string;
  updatedAt: string;
};

function canReplaceAgentDoc(status?: string) {
  return !status || String(status).toUpperCase() === "REJECTED";
}

const REQUIRED_DOCS: Array<{ type: AgentDocumentType; label: string; helper: string }> = [
  {
    type: "BUSINESS_REGISTRATION",
    label: "Business Registration Proof",
    helper: "Certificate / registration document of your company",
  },
  {
    type: "TAX_PAN",
    label: "Tax PAN / Tax Document",
    helper: "Tax PAN card or any valid business tax document",
  },
  {
    type: "IDENTITY_DOCUMENT",
    label: "Identity Document (Passport / Aadhar / ECI)",
    helper: "Identity proof of authorized representative",
  },
];

export default function AgentSelfDocumentsPage() {
  const { data: session, status } = useSession();
  const [docs, setDocs] = useState<AgentDocumentItem[]>([]);
  const [uploadingType, setUploadingType] = useState<AgentDocumentType | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as { id?: string } | undefined)?.id;

  useEffect(() => {
    async function loadDocs() {
      if (!userId) {
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/agents/${encodeURIComponent(userId)}/documents`);
      const data = await res.json().catch(() => ({}));
      setDocs(Array.isArray(data?.items) ? data.items : []);
      setLoading(false);
    }
    void loadDocs();
  }, [userId]);

  const docsMap = useMemo(() => {
    const map = new Map<AgentDocumentType, AgentDocumentItem>();
    for (const doc of docs) map.set(doc.type, doc);
    return map;
  }, [docs]);

  const handleUpload = async (docType: AgentDocumentType, label: string, file: File) => {
    if (!userId) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File exceeds 5MB limit.");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (file.type && !allowed.includes(file.type)) {
      alert("Allowed file types: PDF, JPG, JPEG, PNG.");
      return;
    }

    setUploadingType(docType);
    try {
      const formData = new FormData();
      formData.append("type", docType);
      formData.append("label", label);
      formData.append("file", file);

      const res = await fetch(`/api/agents/${encodeURIComponent(userId)}/documents`, {
        method: "POST",
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Upload failed");

      const uploaded = payload as AgentDocumentItem;
      setDocs((prev) => [...prev.filter((doc) => doc.type !== docType), uploaded]);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingType(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/portal/agent/upload-documents"
        className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#C6A96A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Upload Documents
      </Link>

      <Card className="p-6 border-0 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#C6A96A]" />
          My Verification Documents
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Upload/update verification documents for your profile approval. You can update these later if missed during initial registration.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {REQUIRED_DOCS.map((doc) => {
          const existing = docsMap.get(doc.type);
          const normalizedStatus = String(existing?.status || "PENDING").toUpperCase();
          const canReplace = canReplaceAgentDoc(existing?.status);
          const statusTone =
            normalizedStatus === "VERIFIED"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : normalizedStatus === "REJECTED"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200";
          return (
            <Card key={doc.type} className="p-5 border-0 shadow-sm ring-1 ring-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900">{doc.label}</h2>
                  <p className="text-xs text-gray-500 mt-1">{doc.helper}</p>
                  {existing?.status && (
                    <span className={`inline-flex mt-2 rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusTone}`}>
                      {normalizedStatus.replace(/_/g, " ")}
                    </span>
                  )}
                  {existing?.fileName && (
                    <p className="text-xs text-emerald-700 mt-2 font-medium">
                      Uploaded: {existing.fileName}
                    </p>
                  )}
                  {existing && !canReplace && (
                    <p className="text-xs text-gray-500 mt-2">
                      This submitted document is locked. You can upload a revised file only if admin rejects it.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {existing?.fileUrl && (
                    <a
                      href={existing.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-gray-600 hover:text-[#C6A96A] inline-flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <label className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${canReplace ? 'cursor-pointer bg-[#C6A96A] text-[#0F1B2D] hover:bg-[#B8954F]' : 'cursor-not-allowed bg-gray-200 text-gray-500'}`}>
                    <UploadCloud className="w-3.5 h-3.5" />
                    {uploadingType === doc.type ? "Uploading..." : existing ? (canReplace ? "Upload Revised" : "Locked") : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={uploadingType !== null || !canReplace}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUpload(doc.type, doc.label, file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
