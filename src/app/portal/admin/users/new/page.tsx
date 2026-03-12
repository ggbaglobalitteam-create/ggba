"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { Card } from "@/components/portal/Card";
import { Button } from "@/components/portal/Button";

type Role = "Admin" | "Agent" | "Applicant";
type Status = "Active" | "Pending" | "Inactive";
type ApiRole = "ADMIN" | "AGENT" | "APPLICANT";
type AgentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  status: Status;
}

interface CreatedUser {
  id: string;
}

function roleToApiRole(role: Role): ApiRole {
  if (role === "Admin") return "ADMIN";
  if (role === "Agent") return "AGENT";
  return "APPLICANT";
}

function statusToAgentStatus(status: Status): AgentStatus {
  if (status === "Pending") return "PENDING";
  if (status === "Active") return "APPROVED";
  return "PENDING";
}

async function parseApiError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  return body?.error || fallback;
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function NewUserPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "Applicant",
    status: "Active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const role = roleToApiRole(formData.role);
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() ? formData.phone.trim() : null,
        role,
        suspended: formData.status === "Inactive",
        ...(role === "AGENT" ? { agentStatus: statusToAgentStatus(formData.status) } : {}),
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await parseApiError(res, "Failed to create user"));
      const created: CreatedUser = await res.json();

      router.push(`/portal/admin/users/${created.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create user"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 mb-6">
        <Link
          href="/portal/admin/users"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C6A96A] transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User Management
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C2430]">Add New User</h1>
          <p className="text-gray-500 mt-1">
            Create a new user account with role and access controls.
          </p>
        </div>
      </div>

      <Card className="p-2 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-lg border border-[#C44545]/20 bg-[#C44545]/5 px-4 py-3 text-sm text-[#C44545]">
              {error}
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-[#1C2430] border-b border-gray-100 pb-2 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#1C2430] block">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full h-[46px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#1C2430] block">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full h-[46px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[13px] font-semibold text-[#1C2430] block">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-[46px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[13px] font-semibold text-[#1C2430] block">Password</label>
                <input
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-[46px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[13px] font-semibold text-[#1C2430] block">Phone (optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-[46px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all"
                  placeholder="+91 9999999999"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#1C2430] border-b border-gray-100 pb-2 mb-4">
              System Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#1C2430] block">Role Assignment</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as Role;
                    setFormData((prev) => ({
                      ...prev,
                      role: nextRole,
                      status:
                        nextRole === "Agent"
                          ? prev.status
                          : prev.status === "Pending"
                          ? "Active"
                          : prev.status,
                    }));
                  }}
                  className="w-full h-[46px] bg-white text-[#1C2430] border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="Admin">Administrator</option>
                  <option value="Agent">Agent</option>
                  <option value="Applicant">Applicant</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#1C2430] block">Account Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                  className="w-full h-[46px] bg-white text-[#1C2430] border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="Active">Active / Approved</option>
                  {formData.role === "Agent" && <option value="Pending">Pending Review</option>}
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <Link href="/portal/admin/users">
              <Button type="button" variant="outline" className="px-6 border-[#E5EAF2] text-[#6B7280]">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSaving} className="px-6 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Create User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

