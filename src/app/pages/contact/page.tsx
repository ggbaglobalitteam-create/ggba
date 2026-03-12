"use client";

import { Mail, MapPin, Clock, ArrowRight, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

// Official WhatsApp SVG icon
function WhatsAppIcon({ size = 18 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M16.004 2.667C8.636 2.667 2.667 8.636 2.667 16.004c0 2.354.618 4.663 1.794 6.695L2.667 29.333l6.822-1.76a13.284 13.284 0 0 0 6.515 1.694h.006c7.364 0 13.323-5.969 13.323-13.263 0-3.544-1.38-6.876-3.887-9.385-2.506-2.508-5.837-3.952-9.442-3.952Z"
                fill="currentColor"
            />
            <path
                d="M22.27 19.613c-.317-.158-1.875-.925-2.167-1.031-.291-.106-.503-.158-.714.158-.212.317-.82 1.031-.004 1.031.079 0 .238-.006.344.159.317.476.66.926.926 1.244.212.264.582.317.899.159.873-.423 1.666-.952 2.325-1.612.423-.423.238-1.243-.609-1.507v.399Z"
                fill="white"
            />
            <path
                d="M16.004 4.8c-6.186 0-11.204 5.019-11.204 11.204 0 2.108.585 4.12 1.701 5.86l.265.42-1.126 4.11 4.222-1.107.406.24a11.163 11.163 0 0 0 5.736 1.58h.004c6.182 0 11.196-5.018 11.196-11.203S22.186 4.8 16.004 4.8Zm6.926 15.907a3.716 3.716 0 0 1-2.43 1.757c-.648.138-1.494.247-4.343-1.034-3.64-1.611-5.985-5.305-6.167-5.552-.174-.248-1.46-1.943-1.46-3.706 0-1.763.924-2.627 1.252-2.985a1.32 1.32 0 0 1 .958-.45c.24 0 .48.003.69.013.222.01.518-.084.811.618.302.72 1.024 2.484 1.113 2.663.09.18.15.39.03.627-.12.238-.18.385-.358.594-.18.21-.378.468-.54.63-.18.18-.367.376-.158.738.21.361.932 1.537 2.002 2.489 1.374 1.224 2.532 1.603 2.893 1.783.361.18.571.15.781-.09.21-.24.899-1.05 1.14-1.41.24-.362.48-.301.81-.181.33.12 2.097 0.99 2.458 1.17.36.18.601.27.69.42.09.15.09.87-.21 1.706Z"
                fill="white"
            />
        </svg>
    );
}

export default function Contact() {
    const contactDetails = [
        {
            icon: MapPin,
            title: "Office Locations",
            lines: [
                {
                    label: "Belarus",
                    value: "City of Minsk, Street Olesheva 9, Office 5\nLLC GGBA Global",
                    href: "https://maps.google.com/?q=Olesheva+9,+Minsk,+Belarus",
                },
                {
                    label: "Georgia",
                    value: "Tbilisi, St. Leonidze 2, Tabidze 1\n(Near Freedom Square)\nLLC S.B. Georgia",
                    href: "https://maps.google.com/?q=Leonidze+2,+Tbilisi,+Georgia",
                },
            ],
        },
        {
            icon: Mail,
            title: "Email Address",
            lines: [{ label: null, value: "support@ggbaglobal.com", href: "mailto:support@ggbaglobal.com" }],
        },
        {
            icon: "whatsapp", // special marker
            title: "WhatsApp",
            lines: [{ label: null, value: "+995 555970946", href: "https://wa.me/995555970946?text=Hello%20I%20need%20more%20information" }],
        },
        {
            icon: Clock,
            title: "Business Hours",
            lines: [
                { label: "Mon – Fri", value: "10:00 AM – 6:00 PM (Local Time)" },
                { label: "Sat – Sun", value: "Closed" },
            ],
        },
    ];

    return (
        <div
            className="flex flex-col w-full bg-white pt-24 min-h-screen text-slate-900"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* ── HERO ── */}
            <section className="relative overflow-hidden bg-slate-900 py-28">
                {/* Glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_40%,rgba(251,191,36,0.07),transparent)]" />
                {/* Dot grid */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")",
                    }}
                />
                {/* Rings */}
                <div className="pointer-events-none absolute right-[6%] top-[12%] h-72 w-72 rounded-full border border-amber-400/[0.08]" />
                <div className="pointer-events-none absolute right-[6%] top-[12%] h-48 w-48 translate-x-12 translate-y-12 rounded-full border border-amber-400/[0.05]" />

                <div className="relative container mx-auto px-6 max-w-[1200px]">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5"
                    >
                        <Globe size={12} className="text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Contact</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.08 }}
                        className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4"
                        style={serif}
                    >
                        Get in <span className="text-amber-400">Touch</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.18 }}
                        className="text-slate-300 text-lg max-w-lg leading-relaxed"
                    >
                        We are here to help you with your visa and application needs.
                    </motion.p>
                </div>
            </section>

            {/* ── MAIN CONTENT ── */}
            <section className="py-20 bg-slate-50 flex-1 relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                        {/* ── FORM (3 cols) ── */}
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:col-span-3"
                        >
                            <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm h-full">
                                <h2 className="text-3xl font-bold text-slate-900 mb-8" style={serif}>
                                    How can we help you?
                                </h2>

                                <form className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Your full name"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                        />
                                    </div>

                                    {/* Email + Phone */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Email <span className="text-amber-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="you@example.com"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Phone number <span className="text-amber-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="+1 (000) 000-0000"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Service interest */}
                                    {/* <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">I'm interested in</label>
                                        <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-600 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 appearance-none cursor-pointer">
                                            <option value="">Select a service…</option>
                                            <option>Visa Application Centre</option>
                                            <option>LLC GGBA Global – Belarus</option>
                                            <option>LLC S.B. Georgia</option>
                                            <option>Other</option>
                                        </select>
                                    </div> */}

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Comment</label>
                                        <textarea
                                            rows={5}
                                            placeholder="Tell us how we can help…"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="group w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-semibold text-white transition-all hover:bg-amber-500 hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
                                    >
                                        Send Message
                                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                </form>
                            </div>
                        </motion.div>

                        {/* ── CONTACT DETAILS (2 cols) ── */}
                        <div className="lg:col-span-2 space-y-5">
                            {contactDetails.map((item, index) => {
                                const isWhatsApp = item.icon === "whatsapp";
                                const Icon = isWhatsApp ? null : item.icon;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: 24 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.08, duration: 0.45 }}
                                        className="group flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-200 hover:shadow-[0_8px_24px_rgba(245,158,11,0.08)]"
                                    >
                                        {/* Icon box */}
                                        <div
                                            className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                                                isWhatsApp
                                                    ? "border-green-200 bg-green-50 text-green-500 group-hover:bg-green-100"
                                                    : "border-amber-200 bg-amber-50 text-amber-500 group-hover:bg-amber-100"
                                            }`}
                                        >
                                            {isWhatsApp ? <WhatsAppIcon size={18} /> : <Icon size={18} />}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h4>
                                            <div className="space-y-2.5">
                                                {item.lines.map((line, i) => (
                                                    <div key={i}>
                                                        {line.label && (
                                                            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-500 block mb-0.5">
                                                                {line.label}
                                                            </span>
                                                        )}
                                                        {line.href ? (
                                                            <a
                                                                href={line.href}
                                                                className="text-sm text-slate-600 hover:text-amber-500 transition-colors whitespace-pre-line"
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                {line.value}
                                                            </a>
                                                        ) : (
                                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{line.value}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}