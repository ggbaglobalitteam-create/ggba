"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { Card } from '@/components/portal/Card';
import { Button } from '@/components/portal/Button';
import { Table, TableRow, TableCell } from '@/components/portal/Table';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { Search, Filter, Edit, ShieldCheck, Briefcase, User, Trash2, ExternalLink, X } from 'lucide-react';

type RoleFilter = "ALL" | "ADMIN" | "AGENT" | "APPLICANT";
type UserRole = "ADMIN" | "AGENT" | "APPLICANT";
type Status = "Active" | "Pending" | "Inactive";

interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: UserRole;
    suspended: boolean;
    createdAt: string;
    agent: {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        companyName: string | null;
    } | null;
}

type AgentDocumentItem = {
    id: string;
    type: "BUSINESS_REGISTRATION" | "TAX_PAN" | "IDENTITY_DOCUMENT";
    label: string;
    fileName: string;
    fileUrl: string;
    status: string;
    createdAt: string;
    updatedAt: string;
};

function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error && err.message ? err.message : fallback;
}

function getDisplayStatus(user: UserData): Status {
    if (user.suspended) return "Inactive";
    if (user.role === "AGENT" && user.agent?.status === "PENDING") return "Pending";
    return "Active";
}

function formatRole(role: UserRole): "Admin" | "Agent" | "Applicant" {
    if (role === "ADMIN") return "Admin";
    if (role === "AGENT") return "Agent";
    return "Applicant";
}

export default function UserManagementPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [updatingAgentId, setUpdatingAgentId] = useState<string | null>(null);
    const [docsModalUser, setDocsModalUser] = useState<UserData | null>(null);
    const [agentDocs, setAgentDocs] = useState<AgentDocumentItem[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [docsError, setDocsError] = useState<string | null>(null);

    const loadUsers = async (active = true) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/users", { cache: "no-store" });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error || "Failed to fetch users");
            }
            const body = await res.json();
            if (!active) return;
            setUsers(Array.isArray(body?.items) ? body.items : []);
        } catch (err: unknown) {
            if (!active) return;
            setError(getErrorMessage(err, "Failed to fetch users"));
        } finally {
            if (active) setIsLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        void loadUsers(active);
        return () => {
            active = false;
        };
    }, []);

    const handleRemoveUser = async (id: string) => {
        if (!window.confirm("Remove this user? Only inactive/suspended and unused users can be deleted.")) return;
        setRemovingId(id);
        try {
            const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body?.error || "Failed to remove user");
                return;
            }
            await loadUsers(true);
        } finally {
            setRemovingId(null);
        }
    };

    const openAgentDocsModal = async (user: UserData) => {
        if (!user.agent) return;
        setDocsModalUser(user);
        setDocsLoading(true);
        setDocsError(null);
        setAgentDocs([]);
        try {
            const res = await fetch(`/api/agents/${encodeURIComponent(user.agent.id)}/documents`, { cache: "no-store" });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error || "Failed to load agent documents");
            }
            const body = await res.json().catch(() => ({}));
            setAgentDocs(Array.isArray(body?.items) ? body.items : []);
        } catch (err: unknown) {
            setDocsError(getErrorMessage(err, "Failed to load agent documents"));
        } finally {
            setDocsLoading(false);
        }
    };

    const closeAgentDocsModal = () => {
        setDocsModalUser(null);
        setAgentDocs([]);
        setDocsError(null);
        setDocsLoading(false);
    };

    const updateAgentDocumentStatus = async (
        agentId: string,
        type: AgentDocumentItem["type"],
        status: "VERIFIED" | "REJECTED"
    ) => {
        try {
            const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/documents`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ type, status }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body?.error || "Failed to update document status");
                return;
            }
            setAgentDocs((prev) =>
                prev.map((doc) => (doc.type === type ? { ...doc, status } : doc))
            );
        } catch (err: unknown) {
            alert(getErrorMessage(err, "Failed to update document status"));
        }
    };

    const handleAgentDecision = async (agentId: string, nextStatus: "APPROVED" | "REJECTED") => {
        setUpdatingAgentId(agentId);
        try {
            const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(body?.error || "Failed to update agent status");
                return;
            }

            setUsers((prev) =>
                prev.map((user) =>
                    user.agent?.id === agentId
                        ? {
                              ...user,
                              agent: user.agent
                                  ? {
                                        ...user.agent,
                                        status: body?.status || nextStatus,
                                        companyName: body?.companyName ?? user.agent.companyName,
                                    }
                                  : user.agent,
                          }
                        : user
                )
            );

            if (docsModalUser?.agent?.id === agentId) {
                setDocsModalUser((prev) =>
                    prev
                        ? {
                              ...prev,
                              agent: prev.agent
                                  ? { ...prev.agent, status: nextStatus }
                                  : prev.agent,
                          }
                        : prev
                );
            }
        } finally {
            setUpdatingAgentId(null);
        }
    };

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return users.filter((user) => {
            const matchesSearch =
                !query ||
                user.firstName.toLowerCase().includes(query) ||
                user.lastName.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query);

            const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [roleFilter, searchTerm, users]);

    const stats = useMemo(() => {
        const totalUsers = users.length;
        const activeAgents = users.filter(
            (u) => u.role === "AGENT" && !u.suspended && u.agent?.status !== "PENDING"
        ).length;
        const pendingApprovals = users.filter(
            (u) => u.role === "AGENT" && !u.suspended && u.agent?.status === "PENDING"
        ).length;

        return { totalUsers, activeAgents, pendingApprovals };
    }, [users]);

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case "ADMIN":
                return <ShieldCheck className="w-4 h-4 text-[#C44545]" />;
            case "AGENT":
                return <Briefcase className="w-4 h-4 text-[#C6A96A]" />;
            case "APPLICANT":
                return <User className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1C2430]">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage system administrators, agents, and applicants globally.</p>
                </div>
                <div className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto" onClick={() => router.push("/portal/admin/users/new")}>
                        Add New User
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col justify-center">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Users</h2>
                    <p className="text-3xl font-bold text-[#1C2430]">{stats.totalUsers}</p>
                </Card>
                <Card className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-[#C6A96A]" />
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Agents</h2>
                    </div>
                    <p className="text-3xl font-bold text-[#1C2430]">{stats.activeAgents}</p>
                </Card>
                <Card className="flex flex-col justify-center border-l-4 border-l-[#C6A96A]">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending Approvals</h2>
                    <p className="text-3xl font-bold text-[#C6A96A]">{stats.pendingApprovals}</p>
                </Card>
            </div>

            {/* Controls Bar */}
            <Card noPadding className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-1 focus:ring-[#C6A96A] transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:border-[#C6A96A] focus:ring-1 focus:ring-[#C6A96A] transition-all cursor-pointer"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admins</option>
                            <option value="AGENT">Agents</option>
                            <option value="APPLICANT">Applicants</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Data Table */}
            <Table columns={['User', 'Role', 'Status', 'Date Joined', 'Actions']}>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5}>
                            <div className="py-8 text-center text-gray-500">Loading users...</div>
                        </TableCell>
                    </TableRow>
                ) : error ? (
                    <TableRow>
                        <TableCell colSpan={5}>
                            <div className="py-8 text-center text-[#C44545]">{error}</div>
                        </TableCell>
                    </TableRow>
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[#1C2430]">{user.firstName} {user.lastName}</span>
                                    <span className="text-xs text-gray-500 mt-0.5">{user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {getRoleIcon(user.role)}
                                    <span className="font-medium text-gray-700">{formatRole(user.role)}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={getDisplayStatus(user)} />
                            </TableCell>
                            <TableCell>
                                <span className="text-gray-600">
                                    {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Link href={`/portal/admin/users/${user.id}`}>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#C6A96A] bg-[#C6A96A]/10 hover:bg-[#C6A96A]/20 transition-colors border border-transparent hover:border-[#C6A96A]/30 rounded-lg">
                                            <Edit className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                    </Link>
                                    {user.role === "AGENT" && user.agent && (
                                        <button
                                            onClick={() => void openAgentDocsModal(user)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100 hover:border-indigo-200 rounded-lg"
                                        >
                                            Agent Docs
                                        </button>
                                    )}
                                    {user.role === "AGENT" && user.agent?.status === "PENDING" && (
                                        <>
                                            <button
                                                onClick={() => void handleAgentDecision(user.agent!.id, "APPROVED")}
                                                disabled={updatingAgentId === user.agent.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100 hover:border-emerald-200 rounded-lg disabled:opacity-70"
                                            >
                                                {updatingAgentId === user.agent.id ? "..." : "Approve"}
                                            </button>
                                            <button
                                                onClick={() => void handleAgentDecision(user.agent!.id, "REJECTED")}
                                                disabled={updatingAgentId === user.agent.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100 hover:border-amber-200 rounded-lg disabled:opacity-70"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleRemoveUser(user.id)}
                                        disabled={removingId === user.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100 hover:border-red-200 rounded-lg disabled:opacity-70"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {removingId === user.id ? 'Removing...' : 'Remove'}
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5}>
                            <div className="py-8 text-center text-gray-500">
                                No users found matching your search or filter criteria.
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </Table>

            {docsModalUser && (
                <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-[#1C2430]">Agent Verification Documents</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {docsModalUser.firstName} {docsModalUser.lastName} ({docsModalUser.email})
                                </p>
                            </div>
                            <button
                                onClick={closeAgentDocsModal}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            {docsLoading && (
                                <div className="text-sm text-gray-500">Loading uploaded documents...</div>
                            )}
                            {!docsLoading && docsError && (
                                <div className="text-sm text-[#C44545]">{docsError}</div>
                            )}
                            {!docsLoading && !docsError && agentDocs.length === 0 && (
                                <div className="text-sm text-gray-500">No verification documents uploaded yet.</div>
                            )}

                            {!docsLoading && !docsError && agentDocs.map((doc) => (
                                <div key={doc.id} className="rounded-xl border border-gray-100 p-4 bg-[#F9FAFC]">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-[#1C2430]">{doc.label || doc.type}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{doc.fileName}</p>
                                            <span className={`inline-flex mt-2 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                                String(doc.status).toUpperCase() === 'VERIFIED'
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : String(doc.status).toUpperCase() === 'REJECTED'
                                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                            }`}>
                                                {String(doc.status).replace(/_/g, ' ')}
                                            </span>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Updated {new Date(doc.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
                                            >
                                                Open File
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            {docsModalUser.agent && String(doc.status).toUpperCase() !== 'VERIFIED' && (
                                                <button
                                                    onClick={() => void updateAgentDocumentStatus(docsModalUser.agent!.id, doc.type, "VERIFIED")}
                                                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            {docsModalUser.agent && String(doc.status).toUpperCase() !== 'REJECTED' && (
                                                <button
                                                    onClick={() => void updateAgentDocumentStatus(docsModalUser.agent!.id, doc.type, "REJECTED")}
                                                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-lg"
                                                >
                                                    Reject Doc
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {docsModalUser.agent && docsModalUser.agent.status === "PENDING" && (
                            <div className="px-5 py-4 border-t border-gray-100 bg-[#F9FAFC] flex items-center justify-end gap-2">
                                <button
                                    onClick={() => void handleAgentDecision(docsModalUser.agent!.id, "REJECTED")}
                                    disabled={updatingAgentId === docsModalUser.agent!.id}
                                    className="px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg disabled:opacity-70"
                                >
                                    Reject Agent
                                </button>
                                <button
                                    onClick={() => void handleAgentDecision(docsModalUser.agent!.id, "APPROVED")}
                                    disabled={updatingAgentId === docsModalUser.agent!.id}
                                    className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg disabled:opacity-70"
                                >
                                    Approve Agent
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
