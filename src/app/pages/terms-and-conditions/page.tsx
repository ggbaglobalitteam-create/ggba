"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const sections = [
    {
        title: "Acceptance of Terms",
        content: [
            "By accessing or using the services provided by LLC GGBA Global  you agree to be bound by these Terms and Conditions.",
            "If you do not agree to these terms, please do not use our services or website.",
            "These terms apply to all visitors, users, and anyone who accesses or uses our services.",
        ],
    },
    {
        title: "Services Provided",
        content: [
            "GGBA Global provides visa application assistance, educational admission support, business registration services, work permit processing, and tourism facilitation in Belarus, Georgia, and other countries.",
            "We act as an intermediary between clients and relevant authorities, universities, or employers. We do not guarantee the outcome of any application.",
            "Our services are subject to change, and we reserve the right to modify, suspend, or discontinue any service at any time without prior notice.",
        ],
    },
    {
        title: "Client Responsibilities",
        content: [
            "You are responsible for providing accurate, complete, and truthful information for all applications and service requests.",
            "Submitting false, misleading, or incomplete documents is your sole responsibility and may result in rejection of your application. GGBA Global bears no liability for outcomes resulting from inaccurate information.",
            "You must comply with all applicable laws and regulations of the country you are applying to.",
            "You must inform us immediately of any changes to your circumstances that may affect your application.",
        ],
    },
    {
        title: "Fees & Payments",
        content: [
            "Our service fees are communicated clearly before commencement of any service. Payment is required as agreed prior to service delivery.",
            "Service fees are non-refundable once work has commenced, unless otherwise stated in a specific service agreement.",
            "Fees paid to government authorities, embassies, universities, or other third parties are not included in our service fees unless explicitly stated, and are non-refundable regardless of outcome.",
            "We are not responsible for additional fees imposed by third parties during your application process.",
        ],
    },
    {
        title: "No Guarantee of Outcome",
        content: [
            "GGBA Global does not guarantee the approval of any visa, admission, work permit, or business registration application.",
            "Application decisions are made solely by the relevant government authorities, universities, or employers. Our role is to prepare and submit applications correctly.",
            "We shall not be held liable for any refusal, rejection, or delay caused by third-party authorities.",
        ],
    },
    {
        title: "Intellectual Property",
        content: [
            "All content on our website, including text, graphics, logos, and software, is the property of GGBA Global and is protected by applicable copyright and intellectual property laws.",
            "You may not reproduce, distribute, or create derivative works from our content without our express written permission.",
        ],
    },
    {
        title: "Limitation of Liability",
        content: [
            "To the maximum extent permitted by law, GGBA Global shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.",
            "Our total liability for any claim arising from our services shall not exceed the amount you paid for the specific service giving rise to the claim.",
            "We are not responsible for delays, errors, or losses caused by circumstances beyond our reasonable control, including government processing delays, natural disasters, or technical failures.",
        ],
    },
    {
        title: "Confidentiality",
        content: [
            "We treat all information shared with us in connection with your application as confidential and will not disclose it to third parties except as necessary to provide our services or as required by law.",
            "Please refer to our Privacy Policy for full details on how we handle your personal data.",
        ],
    },
    {
        title: "Termination of Services",
        content: [
            "We reserve the right to refuse or terminate services to any client who violates these terms, provides false information, or engages in unlawful conduct.",
            "You may terminate our services at any time by written notice. Any fees already paid for services rendered are non-refundable.",
        ],
    },
    {
        title: "Governing Law",
        content: [
            "These Terms and Conditions shall be governed by and construed in accordance with the laws of Georgia (the country), without regard to its conflict of law provisions.",
            "Any disputes arising from these terms or our services shall be subject to the exclusive jurisdiction of the courts of Georgia.",
        ],
    },
    {
        title: "Changes to These Terms",
        content: [
            "We reserve the right to update or modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on our website.",
            "Your continued use of our services after any changes constitutes your acceptance of the revised terms.",
        ],
    },
    {
        title: "Contact Information",
        content: [
            "For any questions about these Terms and Conditions, please contact us at support@ggbaglobal.com or visit our Contact page.",
            "LLC GGBA Global — Tbilisi, St. Leonidze 2, Tabidze 1 (Near Freedom Square), Georgia.",
        ],
    },
];

export default function TermsAndConditions() {
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
                        <FileText size={12} className="text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Legal</span>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4" style={serif}
                    >
                        Terms & Conditions
                    </motion.h1>

                    {/* <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
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
                            Please read these Terms and Conditions carefully before using our services. By engaging with <strong>GGBA Global</strong>, you acknowledge that you have read, understood, and agree to be bound by these terms. These terms form a legally binding agreement between you and LLC GGBA Global.
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
                        <Link href="/pages/privacy-policy" className="text-sm text-amber-600 hover:text-amber-500 transition-colors font-medium">
                            View Privacy Policy →
                        </Link>
                    </div> */}
                </div>
            </section>
        </div>
    );
}
