"use client";

import React from 'react';
import { PortalDashboardLayout, NavItem } from '@/components/portal/PortalDashboardLayout';
import { LayoutDashboard, FileStack, CreditCard, UserCog, SlidersHorizontal } from 'lucide-react';

const adminNavigation: NavItem[] = [
    { title: 'Overview', href: '/portal/admin/dashboard', icon: <LayoutDashboard /> },
    { title: 'Applications', href: '/portal/admin/applications', icon: <FileStack /> },
    { title: 'Payments', href: '/portal/admin/payments', icon: <CreditCard /> },
    { title: 'User Management', href: '/portal/admin/users', icon: <UserCog /> },
    { title: 'Form Configs', href: '/portal/admin/form-configs', icon: <SlidersHorizontal /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <PortalDashboardLayout navigation={adminNavigation} roleTitle="System Admin">
            {children}
        </PortalDashboardLayout>
    );
}
