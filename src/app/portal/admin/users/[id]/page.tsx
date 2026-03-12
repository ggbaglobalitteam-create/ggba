"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/portal/Card";
import { Button } from "@/components/portal/Button";
import { ArrowLeft, Copy, KeyRound, RefreshCw, Save } from "lucide-react";

type Role = "Admin" | "Agent" | "Applicant";
type Status = "Active" | "Pending" | "Inactive";
type ApiRole = "ADMIN" | "AGENT" | "APPLICANT";
type AgentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ApiUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: ApiRole;
  suspended: boolean;
  createdAt: string;
  hasPassword: boolean;
  hasAgentManagedApplications: boolean;
  agent: {
    id: string;
    status: AgentStatus;
    companyName: string | null;
  } | null;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: Status;
}

function apiRoleToRole(role: ApiRole): Role {
  if (role === "ADMIN") return "Admin";
  if (role === "AGENT") return "Agent";
  return "Applicant";
}

function roleToApiRole(role: Role): ApiRole {
  if (role === "Admin") return "ADMIN";
  if (role === "Agent") return "AGENT";
  return "APPLICANT";
}

function userStatusToFormStatus(user: ApiUserData): Status {
  if (user.suspended) return "Inactive";
  if (user.role === "AGENT" && user.agent?.status === "PENDING") return "Pending";
  return "Active";
}

async function parseApiError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  return body?.error || fallback;
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = new Uint32Array(14);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export default function UserEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUserData | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "Applicant",
    status: "Active",
  });

  useEffect(() => {
    let active = true;

    async function loadUser() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${params.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await parseApiError(res, "Failed to fetch user"));
        const item: ApiUserData = await res.json();
        if (!active) return;

        setUser(item);
        setFormData({
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          role: apiRoleToRole(item.role),
          status: userStatusToFormStatus(item),
        });
      } catch (err: unknown) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to fetch user"));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: roleToApiRole(formData.role),
        suspended: formData.status === "Inactive",
      };

      const res = await fetch(`/api/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseApiError(res, "Failed to update user"));
      const updated: ApiUserData = await res.json();

      if (payload.role === "AGENT" && updated.agent && payload.suspended === false) {
        const nextAgentStatus: AgentStatus =
          formData.status === "Pending" ? "PENDING" : "APPROVED";

        const agentRes = await fetch(`/api/agents/${updated.agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextAgentStatus }),
        });

        if (!agentRes.ok) {
          throw new Error(await parseApiError(agentRes, "Failed to update agent status"));
        }
      }

      router.push("/portal/admin/users");
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update user"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePassword = () => {
    setGeneratedPassword(generatePassword());
    setPasswordError(null);
    setPasswordNotice(null);
  };

  const handleCopyPassword = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordNotice("Generated password copied.");
      setPasswordError(null);
    } catch {
      setPasswordError("Failed to copy password.");
    }
  };

  const handleSetPassword = async () => {
    if (!user) return;
    if (generatedPassword.length < 6) {
      setPasswordError("Generate a password before saving it.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordNotice(null);

    try {
      const res = await fetch(`/api/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: generatedPassword }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, "Failed to set password"));

      const updated: ApiUserData = await res.json();
      setUser(updated);
      setPasswordNotice(updated.hasPassword ? "Password updated. Applicant can now sign in with this password." : "Password updated.");
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err, "Failed to set password"));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || "User not found."}</p>
        <Link href="/portal/admin/users">
          <Button variant="outline">Back to Users</Button>
        </Link>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-[#1C2430]">Edit User</h1>
          <p className="text-gray-500 mt-1">
            Update profile information, role, and system access status for {user.id}.
          </p>
        </div>
      </div>

      <Card className="p-2 sm:p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-8">
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
                      status: nextRole === "Agent" ? prev.status : prev.status === "Pending" ? "Active" : prev.status,
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

          {formData.role === "Applicant" && (
            <div>
              <h2 className="text-lg font-semibold text-[#1C2430] border-b border-gray-100 pb-2 mb-4">
                Applicant Login Access
              </h2>
              <div className="rounded-2xl border border-[#E5EAF2] bg-[#F8FAFC] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1C2430]">
                      {user.hasPassword ? "Reset applicant password" : "Generate first portal password"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {user.hasAgentManagedApplications
                        ? "This applicant was created through the agent application flow. Generate a password to let them sign in directly."
                        : "Generate a password for this applicant account and share it securely."}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[#C6A96A]/30 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8D6B2F]">
                    {user.hasPassword ? "Password Set" : "No Password"}
                  </span>
                </div>

                {(passwordError || passwordNotice) && (
                  <div
                    className={`rounded-lg px-4 py-3 text-sm ${
                      passwordError
                        ? "border border-[#C44545]/20 bg-[#C44545]/5 text-[#C44545]"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {passwordError || passwordNotice}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    placeholder="Generate a password"
                    className="w-full h-[46px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[8px] px-4 text-sm focus:outline-none shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    className="flex items-center justify-center gap-2 border-[#E5EAF2] text-[#1C2430]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyPassword}
                    disabled={!generatedPassword}
                    className="flex items-center justify-center gap-2 border-[#E5EAF2] text-[#1C2430]"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSetPassword}
                    disabled={!generatedPassword}
                    isLoading={isUpdatingPassword}
                    className="flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    {user.hasPassword ? "Reset Password" : "Set Password"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <Link href="/portal/admin/users">
              <Button type="button" variant="outline" className="px-6 border-[#E5EAF2] text-[#6B7280]">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSaving} className="px-6 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
