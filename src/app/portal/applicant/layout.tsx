"use client";

import React from 'react';
import { PortalDashboardLayout, NavItem } from '@/components/portal/PortalDashboardLayout';
import { LayoutDashboard, FileText, UploadCloud, CreditCard, MessageSquare, Clock, CalendarCheck } from 'lucide-react';

const applicantNavigation: NavItem[] = [
    { title: 'Dashboard', href: '/portal/applicant/dashboard', icon: <LayoutDashboard /> },
    { title: 'Apply', href: '/portal/applicant/application-form?new=1', icon: <FileText /> },
    { title: 'Upload Documents', href: '/portal/applicant/upload-documents', icon: <UploadCloud /> },
    { title: 'Payment', href: '/portal/applicant/payment', icon: <CreditCard /> },
    { title: 'Book Appointment', href: '/portal/applicant/booking', icon: <CalendarCheck /> },
    { title: 'Notifications', href: '/portal/applicant/messages', icon: <MessageSquare /> },
    { title: 'Status', href: '/portal/applicant/status', icon: <Clock /> },
];

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
    return (
        <PortalDashboardLayout navigation={applicantNavigation} roleTitle="Applicant">
            {children}
        </PortalDashboardLayout>
    );
}
