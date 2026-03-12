"use client";

import React from 'react';
import { PortalDashboardLayout, NavItem } from '@/components/portal/PortalDashboardLayout';
import { LayoutDashboard, Users, FileBarChart, UploadCloud, CreditCard, CalendarCheck, MessageSquare, Award } from 'lucide-react';

const agentNavigation: NavItem[] = [
    { title: 'Dashboard', href: '/portal/agent/dashboard', icon: <LayoutDashboard /> },
    { title: 'My Applicants', href: '/portal/agent/applicants', icon: <Users /> },
    { title: 'Upload Documents', href: '/portal/agent/upload-documents', icon: <UploadCloud /> },
    { title: 'Payment', href: '/portal/agent/payment', icon: <CreditCard /> },
    { title: 'Book Appointment', href: '/portal/agent/booking', icon: <CalendarCheck /> },
    { title: 'Notifications', href: '/portal/agent/notifications', icon: <MessageSquare /> },
    { title: 'Certificate', href: '/portal/agent/certificate', icon: <Award /> },
    { title: 'Reports', href: '#', icon: <FileBarChart /> },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    return (
        <PortalDashboardLayout navigation={agentNavigation} roleTitle="Agent">
            {children}
        </PortalDashboardLayout>
    );
}
