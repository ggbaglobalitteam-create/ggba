"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Globe, Shield, Lightbulb, Star } from "lucide-react";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

export default function AboutGgbaGlobal() {
    const values = [
        {
            icon: Star,
            title: "Excellence",
            desc: "We strive for the highest standards in everything we do, ensuring quality service and successful outcomes for our clients.",
        },
        {
            icon: Shield,
            title: "Integrity",
            desc: "Transparency, honesty, and ethical practices are at the core of our business relationships and operations.",
        },
        {
            icon: Lightbulb,
            title: "Innovation",
            desc: "We continuously adapt and improve our services to meet the evolving needs of our global clientele.",
        },
    ];

    const entities = [
        {
            title: "International Application Centre",
            desc: "Visa applications, appointments, and comprehensive support for international travel.",
            href: "/pages/international-application-centre",
            tag: "Travel & Immigration",
        },
        {
            title: "LLC GGBA Global, Belarus",
            desc: "Services for students, universities, investors, workers, and employers in Belarus.",
            href: "/pages/llc-ggba-global",
            tag: "Education & Business",
        },
        {
            title: "S.B. Georgia LLC",
            desc: "Education, medicine, business, and tourism opportunities in Georgia.",
            href: "/pages/s-b-georgia-llc",
            tag: "Multi-Sector",
        },
    ];

    const stats = [
        { value: "3", label: "Global Entities" },
        { value: "50+", label: "Countries Served" },
        { value: "10k+", label: "Clients Supported" },
        { value: "100%", label: "Commitment" },
    ];

    return (
        <div
            className="flex flex-col w-full bg-white pt-24 min-h-screen text-slate-900"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >
            {/* ── HERO ── */}
            <section className="relative overflow-hidden bg-slate-900 py-32">
                {/* Background texture */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_40%,rgba(251,191,36,0.07),transparent)]" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")",
                    }}
                />
                {/* Decorative rings */}
                <div className="pointer-events-none absolute right-[5%] top-[10%] h-72 w-72 rounded-full border border-amber-400/10" />
                <div className="pointer-events-none absolute right-[5%] top-[10%] h-48 w-48 translate-x-12 translate-y-12 rounded-full border border-amber-400/[0.07]" />

                <div className="relative container mx-auto px-6 max-w-[1200px]">
                    <div className="max-w-2xl">


          <motion.h1
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.65, delay: 0.08 }}
    className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6"
    style={serif}
>
    About Us
</motion.h1>

<motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.65, delay: 0.18 }}
    className="flex flex-col gap-2"
>
    <p className="text-amber-400 text-xl md:text-2xl font-medium">
        Partnering Governments & Universities, Globally.
    </p>
    <p className="text-amber-400 text-xl md:text-2xl font-medium">
        Investments | Business | Education.
    </p>
    <p className="text-white/70 text-lg md:text-xl mt-2">
        • Tbilisi, Georgia &nbsp;•&nbsp; Minsk, Belarus.
    </p>
</motion.div>

                    </div>
                </div>
            </section>

            {/* ── STATS STRIP ── */}


            {/* ── ABOUT CONTENT ── */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-16 items-start">

                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >

                            <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight" style={serif}>
                                About GGBA Global
                            </h2>
                            <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                                <p>
                                    GGBA Global is a leading international service provider dedicated to facilitating cross-border opportunities for individuals, businesses, and institutions. With a presence across multiple countries, we have built a reputation for excellence, reliability, and comprehensive support.
                                </p>
                                <p>
                                    Our mission is to simplify complex international processes and provide our clients with the guidance, resources, and expertise they need to succeed in their global endeavors. Whether you're seeking educational opportunities, business expansion, or travel assistance, GGBA Global is your trusted partner every step of the way.
                                </p>
                                <p>
                                    Through our specialized entities—the International Application Centre, LLC GGBA Global (Belarus), and S.B. Georgia LLC—we offer a comprehensive suite of services tailored to meet the unique needs of our diverse clientele.
                                </p>
                            </div>

                        </motion.div>



                    </div>
                </div>
            </section>

            {/* ── VALUES ── */}
            <section className="py-24 bg-slate-50 relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-14 text-center"
                    >

                        <h2 className="text-4xl font-bold text-slate-900 leading-tight" style={serif}>Our Values</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 28 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="group rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_8px_32px_rgba(245,158,11,0.1)]"
                                >
                                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                                        <Icon size={22} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3" style={serif}>{value.title}</h3>
                                    <p className="text-sm leading-relaxed text-slate-500">{value.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── OUR ENTITIES ── */}
            {/* <section className="py-24 bg-white relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-14"
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Our Network</p>
                        <h2 className="text-4xl font-bold text-slate-900 leading-tight" style={serif}>Our Specialized Entities</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {entities.map((entity, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                                <Link
                                    href={entity.href}
                                    className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-[0_12px_40px_rgba(245,158,11,0.1)]"
                                >
                                    <span className="mb-3 inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                                        {entity.tag}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors" style={serif}>
                                        {entity.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed flex-grow">{entity.desc}</p>
                                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-400 group-hover:text-amber-500 transition-colors">
                                        Learn more <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* ── CONTACT CTA ── */}

        </div>
    );
}