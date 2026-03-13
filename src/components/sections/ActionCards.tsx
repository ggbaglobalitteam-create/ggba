"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calendar, Search, LogIn } from "lucide-react";

import { APPLICATION_STATUS_ROUTE, APPOINTMENT_BOOKING_ROUTE, PORTAL_LOGIN_ROUTE } from "@/lib/portalRoutes";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

export default function AdditionalInfo() {
    const items = [
        {
            icon: LogIn,
            title: "LOGIN",
            desc: "Access your application portal and account services",
            action: "Login",
            href: PORTAL_LOGIN_ROUTE,
            isLink: true,
        },
        {
            icon: Search,
            title: "Track your application",
            desc: "Check your application status inside the portal",
            action: "Track now",
            href: APPLICATION_STATUS_ROUTE,
            isLink: true,
        },
        {
            icon: Calendar,
            title: "Book an appointment",
            desc: "Schedule your application submission appointment",
            action: "Book now",
            href: APPOINTMENT_BOOKING_ROUTE,
            isLink: true,
        },
    ];

    return (
        <section
            className="py-24 bg-white relative"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* Top divider */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

            <div className="container mx-auto px-6 max-w-[1400px]">
                <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-medium text-slate-900 text-center mb-12"
                    style={serif}
                >
                    QUICK LINKS
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.45 }}
                                className="group flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-[0_12px_32px_rgba(245,158,11,0.1)]"
                            >
                                {/* Icon */}
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                                    <Icon size={20} />
                                </div>

                                {/* Text */}
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-500 mb-8 flex-grow leading-relaxed">{item.desc}</p>

                                <Link
                                    href={item.href}
                                    className="group/btn flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-500 mt-auto"
                                >
                                    {item.action}
                                    <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-0.5" />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
