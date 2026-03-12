"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Globe, Shield, Star } from "lucide-react";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

export default function WhyChooseUs() {
    const reasons = [
        {
            icon: Globe,
            number: "01",
            title: "Global Expertise",
            description: "Years of experience serving clients across multiple countries and regions",
        },
        {
            icon: Shield,
            number: "02",
            title: "Comprehensive Services",
            description: "From visa applications to business setup, we cover all your international needs.",
        },
        {
            icon: Star,
            number: "03",
            title: "Trusted Partner",
            description: "Dedicated support and guidance throughout your journey with us.",
        },
    ];

    return (
        <section
            className="py-24 bg-slate-50 relative overflow-hidden"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* Top divider */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

            {/* Decorative background number */}
            <div
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[22rem] font-black leading-none text-slate-900/[0.025]"
                style={serif}
                aria-hidden
            >
                3
            </div>

            <div className="relative container mx-auto px-6 max-w-[1400px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: heading block */}
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">
                            Why Us
                        </p> */}
                        <h2
                            className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6"
                            style={serif}
                        >
                            Why Choose<br />
                            GGBA Global?
                        </h2>
                        {/* <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-md">
                            We bring together expertise, reach, and care to deliver international services that genuinely make a difference for every client we serve.
                        </p>
                        <Link
                            href="/pages/about-ggba-global"
                            className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-amber-500"
                        >
                            Learn About Us
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                        </Link> */}
                    </motion.div>

                    {/* Right: reason cards */}
                    <div className="space-y-5">
                        {reasons.map((reason, index) => {
                            const Icon = reason.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 24 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="group flex items-start gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-200 hover:shadow-[0_8px_24px_rgba(245,158,11,0.09)]"
                                >
                                    <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <div className="mb-1 font-mono text-xs font-bold text-slate-300">
                                            {reason.number}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">
                                            {reason.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {reason.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}