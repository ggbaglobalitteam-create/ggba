"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const sections = [
    {
        title: "Information We Collect",
        content: [
            "We collect information you provide directly to us, including your name, email address, phone number, passport details, and any documents submitted through our services.",
            "We may also collect information automatically when you use our website, including IP address, browser type, pages visited, and cookies or similar tracking technologies.",
            "If you apply for a visa or educational program through our platform, we collect application-related information including academic records, financial statements, and supporting documents.",
        ],
    },
    {
        title: "How We Use Your Information",
        content: [
            "To process visa applications, educational admissions, and business registration requests on your behalf.",
            "To communicate with you about your application status, appointments, and relevant updates.",
            "To improve our services and website functionality, ensuring a better experience for all users.",
            "To comply with applicable legal obligations, including immigration laws and data protection regulations.",
            "To send you relevant information about our services, offers, and updates — only with your consent.",
        ],
    },
    {
        title: "Sharing Your Information",
        content: [
            "We share your personal data with relevant government authorities, embassies, consulates, and institutions as required for processing your application.",
            "We may share your information with trusted partner universities, employers, and legal service providers strictly for the purpose of fulfilling your service request.",
            "We do not sell, rent, or trade your personal data to third parties for marketing purposes.",
            "We may disclose information if required by law or to protect the rights and safety of our clients and staff.",
        ],
    },
    {
        title: "Data Storage & Security",
        content: [
            "Your data is stored on secure servers with encryption, access controls, and regular security audits.",
            "We retain your personal data only for as long as necessary to fulfil the purposes outlined in this policy, or as required by law.",
            "In the event of a data breach that affects your rights, we will notify you in accordance with applicable data protection laws.",
            "While we take all reasonable measures to protect your data, no internet transmission is 100% secure. We encourage you to use strong passwords and secure connections.",
        ],
    },
    {
        title: "Cookies & Tracking",
        content: [
            "Our website uses cookies to enhance your browsing experience, remember preferences, and analyze site traffic.",
            "You can control cookie settings through your browser. Disabling cookies may affect some features of our website.",
            "We use analytics tools to understand how users interact with our site. This data is anonymized and used solely to improve our services.",
        ],
    },
    {
        title: "Your Rights",
        content: [
            "You have the right to access, correct, or delete your personal data held by us at any time.",
            "You may withdraw consent for marketing communications at any time by contacting us or using the unsubscribe link in our emails.",
            "You have the right to request a copy of your personal data in a structured, machine-readable format.",
            "If you believe your data has been mishandled, you have the right to lodge a complaint with the relevant data protection authority.",
        ],
    },
    {
        title: "Third-Party Links",
        content: [
            "Our website may contain links to third-party websites. We are not responsible for the privacy practices of those websites and encourage you to review their privacy policies.",
        ],
    },
    {
        title: "Changes to This Policy",
        content: [
            "We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated effective date.",
            "Your continued use of our services after changes are posted constitutes your acceptance of the revised policy.",
        ],
    },
    {
        title: "Contact Us",
        content: [
            "If you have any questions about this Privacy Policy or how we handle your data, please contact us at support@ggbaglobal.com or visit our Contact page.",
        ],
    },
];

export default function PrivacyPolicy() {
    return (
        <div
            className="flex flex-col w-full bg-white pt-24 min-h-screen text-slate-900"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* ── HERO ── */}
            <section className="relative overflow-hidden bg-slate-900 py-20">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(251,191,36,0.06),transparent)]" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                />
                <div className="relative container mx-auto px-6 max-w-[1200px]">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5"
                    >
                        <Shield size={12} className="text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Legal</span>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4" style={serif}
                    >
                        Privacy Policy
                    </motion.h1>
{/* 
                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
                        className="text-slate-400 text-sm max-w-lg"
                    >
                        Effective date: January 1, 2025 · Last updated: January 1, 2025
                    </motion.p> */}
                </div>
            </section>

            {/* ── CONTENT ── */}
            <section className="py-16 bg-slate-50">
                <div className="container mx-auto px-6 max-w-[860px]">

                    {/* Intro card */}
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                        className="rounded-2xl border border-amber-200 bg-amber-50 p-8 mb-10"
                    >
                        <p className="text-sm text-slate-700 leading-relaxed">
                            At <strong>GGBA Global</strong> ("we", "us", "our"), we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our website and services. Please read it carefully.
                        </p>
                    </motion.div>

                    {/* Sections */}
                    <div className="space-y-8">
                        {sections.map((section, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.45 }}
                                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                            >
                                <div className="flex items-start gap-4 mb-5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-600">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <h2 className="text-xl font-bold text-slate-900" style={serif}>{section.title}</h2>
                                </div>
                                <div className="space-y-3 pl-11">
                                    {section.content.map((para, j) => (
                                        <p key={j} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2.5">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                            {para}
                                        </p>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Back link */}
                    {/* <div className="mt-12 flex items-center justify-between">
                        <Link href="/" className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                            Back to Home
                        </Link>
                        <Link href="/pages/terms-and-conditions" className="text-sm text-amber-600 hover:text-amber-500 transition-colors font-medium">
                            View Terms & Conditions →
                        </Link>
                    </div> */}
                </div>
            </section>
        </div>
    );
}
