"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Linkedin, Facebook, Instagram, ArrowUpRight } from "lucide-react";

import { APPLICATION_STATUS_ROUTE, APPOINTMENT_BOOKING_ROUTE, PORTAL_LOGIN_ROUTE } from "@/lib/portalRoutes";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const quickLinks = [
    { label: "Login", href: PORTAL_LOGIN_ROUTE },
    { label: "Track your application", href: APPLICATION_STATUS_ROUTE },
    { label: "Book an appointment", href: APPOINTMENT_BOOKING_ROUTE },
];

const entities = [
    // { label: "Visa Application Centre", href: "/pages/international-application-centre" },
    { label: "LLC GGBA Global, Belarus", href: "/pages/llc-ggba-global" },
    { label: "LLC S.B. Georgia", href: "/pages/s-b-georgia-llc" },
];

const legal = [
    { label: "Privacy Policy", href: "/pages/privacy-policy" },
    { label: "Terms & Conditions", href: "/pages/terms-and-conditions" },
];

const socials = [
    { icon: Facebook, href: "https://www.facebook.com/share/17hdUyBPPF/", label: "Facebook" },
    { icon: Instagram, href: "https://www.instagram.com/ggba_global", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/ggbaglobal/", label: "LinkedIn" },
];

export default function Footer() {
    const pathname = usePathname();
    const isDashboardRoute = pathname?.startsWith('/portal/applicant') || pathname?.startsWith('/portal/agent') || pathname?.startsWith('/portal/admin');
    const isAuthRoute = pathname?.includes('/portal/login') || pathname?.includes('/portal/register') || pathname?.includes('/portal/verify-otp');
    const isCertificateRoute = pathname?.startsWith('/certificate/agent');

    if (isDashboardRoute || isAuthRoute || isCertificateRoute) return null;

    return (
        <footer
            className="relative bg-slate-900 text-white overflow-hidden"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* Subtle amber glow top-left */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-400/5 blur-3xl" />
            {/* Dot grid texture */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
            />

            {/* ── TOP DIVIDER ── */}
            <div className="relative h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

            {/* ── MAIN GRID ── */}
            <div className="relative container mx-auto px-6 max-w-[1200px] pt-16 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

                    {/* Brand col — spans 2 on lg */}
                    <div className="lg:col-span-2">
                        {/* Logo lockup */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-900">
                               <img src='/images/logo.png' alt="GGBA Global logo" />
                            </div>
                            <span className="text-lg font-bold tracking-tight" style={serif}>GGBA Global</span>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
                          Your trusted partner for international services across multiple regions.
                        </p>

                        {/* Contact snippets */}
                        {/* <div className="space-y-2.5 mb-7">
                            <a href="mailto:support@ggbaglobal.com" className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-amber-400 transition-colors group">
                                <Mail size={14} className="shrink-0 text-amber-500/70 group-hover:text-amber-400 transition-colors" />
                                support@ggbaglobal.com
                            </a>
                            <a href="https://wa.me/995555970946" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-amber-400 transition-colors group">
                                <Phone size={14} className="shrink-0 text-amber-500/70 group-hover:text-amber-400 transition-colors" />
                                +995 555 970 946
                            </a>
                            <a href="https://maps.google.com/?q=Leonidze+2,+Tbilisi,+Georgia" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-amber-400 transition-colors group">
                                <MapPin size={14} className="shrink-0 text-amber-500/70 group-hover:text-amber-400 transition-colors" />
                                Tbilisi, Georgia
                            </a>
                        </div> */}

                        {/* Socials */}
                        <div className="flex gap-2.5">
                            {socials.map(({ icon: Icon, href, label }) => (
                                <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-400 transition-all"
                                >
                                    <Icon size={15} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h5 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-5">Quick Links</h5>
                        <ul className="space-y-3">
                            {quickLinks.map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                                        <span className="h-px w-3 bg-slate-600 group-hover:w-4 group-hover:bg-amber-400 transition-all duration-200" />
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Our Entities */}
                    <div>
                        <h5 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-5">Our Entities</h5>
                        <ul className="space-y-3">
                            {entities.map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                                        <span className="h-px w-3 bg-slate-600 group-hover:w-4 group-hover:bg-amber-400 transition-all duration-200" />
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    {/* <div>
                        <h5 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-5">Services</h5>
                        <ul className="space-y-3">
                            {services.map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                                        <span className="h-px w-3 bg-slate-600 group-hover:w-4 group-hover:bg-amber-400 transition-all duration-200" />
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div> */}
                </div>

                {/* ── BOTTOM BAR ── */}
                <div className="relative pt-8 border-t border-white/10">
                    {/* Amber accent line */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <p>&copy; {new Date().getFullYear()} LLC GGBA Global. All rights reserved.</p>

                        <div className="flex items-center gap-6">
                            {legal.map(({ label, href }) => (
                                <Link key={label} href={href}
                                    className="hover:text-amber-400 transition-colors flex items-center gap-1 group"
                                >
                                    {label}
                                    <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            ))}
                        </div>

                        {/* <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-xs text-slate-600">Serving 50+ Countries</span>
                        </div> */}
                    </div>
                </div>
            </div>
        </footer>
    );
}
