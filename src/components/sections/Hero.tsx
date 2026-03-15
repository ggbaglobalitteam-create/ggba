"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

export default function Hero() {
    return (
        <section className="relative w-full min-h-[100svh] flex items-end overflow-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/hero-1.jpg')" }}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/30" />
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/70 to-transparent" />

            {/* Decorative rings */}
            <div className="pointer-events-none absolute right-[6%] top-[20%] z-10 h-80 w-80 rounded-full border border-amber-400/[0.08]" />
            <div className="pointer-events-none absolute right-[6%] top-[20%] z-10 h-52 w-52 translate-x-14 translate-y-14 rounded-full border border-amber-400/[0.06]" />
            <div className="pointer-events-none absolute right-[6%] top-[20%] z-10 h-28 w-28 translate-x-[6.5rem] translate-y-[6.5rem] rounded-full bg-amber-400/[0.04]" />

            {/* Content */}
            <div className="relative z-20 container mx-auto px-6 max-w-[1400px] pb-24 pt-40">
                <div className="max-w-2xl">
                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.08 }}
                        className="text-6xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6"
                        style={serif}
                    >
                        Welcome to<br />
                        <span className="text-amber-400">GGBA Global</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.18 }}
                        className="text-lg text-slate-300 leading-relaxed max-w-lg mb-10"
                    >
                        Your trusted partner for international services across multiple regions
                    </motion.p>

                    {/* Info Lines */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.24 }}
                        className="flex flex-col gap-2 mb-10"
                    >
                        <p className="text-amber-400 text-xl font-medium">
                            GGBA Global | Investments; Business; Education.
                        </p>
                        <p className="text-white/70 text-lg mt-1">
                            • Tbilisi, Georgia &nbsp;•&nbsp; Minsk, Belarus.
                        </p>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.28 }}
                        className="flex flex-wrap gap-4"
                    >
                        {/* <Link ... /> */}
                    </motion.div>
                </div>
            </div>

            {/* Fade to white at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-white to-transparent" />
        </section>
    );
}
