"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { useSession } from 'next-auth/react';
import RegistrationNotice from '@/components/layout/RegistrationNotice';

export interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
}

interface PortalDashboardLayoutProps {
    children: React.ReactNode;
    navigation: NavItem[];
    roleTitle: string;
}

type DashboardNotification = {
    id: string;
    title: string;
    body?: string | null;
    isRead: boolean;
    createdAt: string;
    applicationId?: string | null;
};

export function PortalDashboardLayout({ children, navigation, roleTitle }: PortalDashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const previousUnreadCountRef = useRef(0);
    const pathname = usePathname();
    const { logout, role } = useRole();
    const { data: session } = useSession();

    const displayName = session?.user?.name || 'User';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || 'U';

    const notificationHref = useMemo(() => {
        return (applicationId?: string | null) => {
            if (!applicationId) return '#';
            if (role === 'admin') return `/portal/admin/applications/${applicationId}`;
            if (role === 'agent') return `/portal/agent/applicants/${applicationId}`;
            return '/portal/applicant/status';
        };
    }, [role]);

    useEffect(() => {
        let active = true;

        async function loadNotifications() {
            const res = await fetch('/api/notifications?limit=8').catch(() => null);
            const json = await res?.json().catch(() => null);
            const items = Array.isArray(json?.items) ? json.items : [];
            if (!active) return;

            const nextUnreadCount = Number(json?.unreadCount || 0);
            setNotifications(items);
            setUnreadCount(nextUnreadCount);

            const userId = (session?.user as { id?: string } | undefined)?.id || 'guest';
            const highlightKey = `ggba_notifications_highlighted_${userId}`;
            const hasHighlightedThisSession = typeof window !== 'undefined' && window.sessionStorage.getItem(highlightKey) === '1';

            if (nextUnreadCount > 0 && (!hasHighlightedThisSession || nextUnreadCount > previousUnreadCountRef.current)) {
                setIsNotificationsOpen(true);
                if (typeof window !== 'undefined') {
                    window.sessionStorage.setItem(highlightKey, '1');
                }
            }

            previousUnreadCountRef.current = nextUnreadCount;
        }
        void loadNotifications();

        return () => {
            active = false;
        };
    }, [session?.user]);

    const markAllRead = async () => {
        if (unreadCount <= 0) return;
        const res = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'MARK_ALL_READ' }),
        }).catch(() => null);
        const json = await res?.json().catch(() => null);
        setUnreadCount(Number(json?.unreadCount || 0));
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    };

    return (
        <div className="h-screen bg-[#F6F8FB] flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-[88px] flex items-center justify-between px-6 border-b border-gray-800 bg-[#0F1B2D]">
                    <div className="flex items-center gap-2 w-full justify-center">
                        <Link href="/">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/logo.png" alt="GGBA Global" className="h-[40px] w-auto drop-shadow-md brightness-200 contrast-150" />
                        </Link>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5">
                    <span className="inline-block px-2.5 py-1 bg-[#C6A96A]/10 text-[#C6A96A] text-xs font-bold uppercase tracking-wider rounded-md border border-[#C6A96A]/20">
                        {roleTitle} Portal
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-1 mb-4">
                    {navigation.map((item) => {
                        const itemPath = item.href.split('?')[0];
                        const isActive = pathname.startsWith(itemPath);
                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-[#C6A96A]/15 text-[#C6A96A] border border-[#C6A96A]/30'
                                        : 'text-[#1C2430] hover:bg-[#F6F8FB]'}
                `}
                            >
                                {React.cloneElement(item.icon as React.ReactElement, {
                                    className: `w-5 h-5 ${isActive ? 'text-[#C6A96A]' : 'text-[#6B7280] group-hover:text-[#1C2430]'}`
                                })}
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <header className="h-[88px] bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mr-4 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 hidden sm:block tracking-tight">Dashboard Overview</h2>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                                className="relative text-gray-500 hover:text-[#C6A96A] p-2 rounded-full hover:bg-gray-100 transition-colors"
                                title="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#C44545] text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                                        <button
                                            onClick={() => void markAllRead()}
                                            className="text-xs font-semibold text-[#C6A96A] hover:text-[#0F1B2D] transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 && (
                                            <p className="px-4 py-5 text-sm text-gray-500">No notifications yet.</p>
                                        )}
                                        {notifications.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={notificationHref(item.applicationId)}
                                                onClick={() => setIsNotificationsOpen(false)}
                                                className={`block px-4 py-3 border-b border-gray-100 hover:bg-[#F6F8FB] transition-colors ${item.isRead ? 'bg-white' : 'bg-amber-50/40'}`}
                                            >
                                                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                                {item.body && <p className="text-xs text-gray-600 mt-1">{item.body}</p>}
                                                <p className="text-[11px] text-gray-400 mt-1.5">{new Date(item.createdAt).toLocaleString()}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 pl-4 border-l border-[#E5EAF2]">
                            <div className="flex items-center gap-3 cursor-pointer group">
                                <div className="w-9 h-9 bg-[#0F1B2D] border border-[#E5EAF2] rounded-full flex items-center justify-center text-[#C6A96A] font-semibold text-sm">
                                    {initials}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-semibold text-[#1C2430] leading-none mb-1 group-hover:text-[#C6A96A] transition-colors mt-1">{displayName}</p>
                                    <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-widest">{role || 'GUEST'}</p>
                                </div>
                            </div>
                            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                            <button
                                onClick={() => logout()}
                                className="flex items-center gap-2 text-gray-500 hover:text-[#C44545] p-2 md:px-3 md:py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                                <span className="hidden md:inline text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#F6F8FB]">
                    <div className="max-w-6xl mx-auto w-full pb-8">
                        {unreadCount > 0 && (
                            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-amber-900">
                                        You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}.
                                    </p>
                                    <p className="text-xs text-amber-800 mt-1">
                                        Recent application, status, message, and workflow updates are waiting in your notification panel.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsNotificationsOpen(true)}
                                        className="rounded-lg bg-[#0F1B2D] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1b2a42]"
                                    >
                                        View Notifications
                                    </button>
                                    <button
                                        onClick={() => void markAllRead()}
                                        className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                                    >
                                        Mark All Read
                                    </button>
                                </div>
                            </div>
                        )}
                        {children}
                    </div>
                </main>

                {/* Regulatory disclosure */}
                <footer className="shrink-0 border-t border-[#E5EAF2] bg-white px-4 py-4 lg:px-8">
                    <RegistrationNotice className="text-[#6B7280]" />
                </footer>
            </div>
        </div>
    );
}
