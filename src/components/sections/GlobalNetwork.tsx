"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

export default function GlobalNetwork() {
    const networks = [
        {
            title: "Visa Application Centre",
            description: "Visa applications, appointments, and comprehensive support for international travel.",
            // image: "/images/network-visa.png",
            href: "/pages/international-application-centre",
            tag: "Travel & Immigration",
            region: "International",
        },
        {
            title: "LLC GGBA Global, Belarus",
            description: "Services for students, universities, investors, workers, and employers in Belarus.",
            // image: "/images/network-belarus.png",
            href: "/pages/llc-ggba-global",
            tag: "Education & Business",
            region: "Belarus",
        },
        {
            title: "LLC S.B. Georgia",
            description: "Education, medicine, business, and tourism opportunities in Georgia.",
            // image: "/images/network-georgia.png",
            href: "/pages/s-b-georgia-llc",
            tag: "Multi-Sector",
            region: "Georgia",
        },
    ];

    return (
        <section className="py-24 bg-white" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
            <div className="container mx-auto px-6 max-w-[1400px]">

                {/* Header */}
                <div className="mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3"
                    >
                        {/* Our Entities */}
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: 0.05 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-4"
                        style={serif}
                    >
                        Our Global Network
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-slate-500 max-w-lg text-base leading-relaxed"
                    >
                       GGBA Global is a leading international service provider with specialized entities serving clients worldwide. Choose your area of interest to explore our services.
                    </motion.p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {networks.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Link href={item.href} className="group block h-full">
                                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-200 hover:bg-white hover:shadow-[0_16px_48px_rgba(245,158,11,0.12)]">

                                    {/* Image area */}
                                    {/* <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 flex items-center justify-center p-8">
                                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.06),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                      
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="relative z-10 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                                        />
                                       
                                    </div> */}

                                    {/* Content */}
                                    <div className="flex flex-col p-7">
                                        {/* <span className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-amber-500">
                                            {item.tag}
                                        </span> */}
                                        <div className="flex items-start justify-between gap-3">
                                            <h3
                                                className="text-xl font-bold text-slate-900 leading-snug tracking-tight group-hover:text-amber-600 transition-colors duration-300"
                                                style={serif}
                                            >
                                                {item.title}
                                            </h3>
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-300 group-hover:border-amber-300 group-hover:bg-amber-500 group-hover:text-white">
                                                <ArrowUpRight size={14} />
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-500">
                                            {item.description}
                                        </p>
                                        <div className="mt-5 h-px bg-gradient-to-r from-amber-400/30 to-transparent" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Divider footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="mt-16 flex items-center gap-4"
                >
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="whitespace-nowrap text-xs tracking-wide text-slate-400">
                       
                    </span>
                    <div className="h-px flex-1 bg-slate-100" />
                </motion.div>
            </div>
        </section>
    );
}