"use client";

import { Globe, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import ActionCards from "@/components/sections/ActionCards";
import Link from "next/link";
import { motion } from "framer-motion";

import { APPOINTMENT_BOOKING_ROUTE } from "@/lib/portalRoutes";

const infoSteps = [
    {
        num: 1,
        title: "Identify visa type",
        body: "The first step is to determine which visa type you need, and check whether you're eligible to apply for it. You'll also need to know the documents that you'll have to submit along with your application, how long the application might take and fees you'll have to pay. Each application must comply with the guidelines applicable for your visa category. If your documents are not in English, you may need to get translations prepared before applying.",
    },
    {
        num: 2,
        title: "Begin your application",
        body: "Once you are ready to apply, you can download the visa application form , complete it, print the complete form and bring it with you to the Visa Application Centre (together with the documents required for the Visa category chosen) for submission.",
    },
    {
        num: 3,
        title: "Book an appointment",
        body: "Once you have filled your visa form, you need to book an appointment to submit your application at the Visa Application Centre. Once you've booked your appointment, you'll receive an appointment confirmation email along with the letter of appointment. If you are part of a family or group, you'll have to book individual appointments for each member of the family or group.",
    },
    {
        num: 4,
        title: "Pay your fees",
        body: "Once you have made your application, you will need to pay your visa application fee. If you download the form to print and bring to the Visa Application Centre, payment will be made at the time of your appointment . You can pay the visa fee at the visa application centre using Credit/Debit Card, Cash, and UPI.",
    },
    {
        num: 5,
        title: "Visit a Visa Application Centre",
        body: "You'll have to submit your complete visa application form at the Visa Application Centre Find out What happens at the Visa Application Centre.",
    },
    {
        num: 6,
        title: "Track your application",
        body: "You will receive an email update when your decision has been returned to the Visa Application Centre. You can also track your visa application status online. Use the Reference Number present on the invoice/receipt issued by the Visa Application Centre along with your date of birth to access this service.",
    },
    {
        num: 7,
        title: "Collect your passport",
        body: "After a visa application decision has been made, you can pick up your passport from the Visa Application Centre or have your passport returned to you by courier for an additional fee. Collecting your passport in person: bring the receipt issued by the Visa Application Centre and a form of Government identification. If permitted you may be able to send a representative to collect your passport; they will need to present a letter of authorization signed by you, bring the receipt issued to you by the Visa Application Centre and their Government identification. Please check the Visa Application Centre opening time for the options available to collect your documents .",
    },
];

const whyUs = [
    { icon: Globe, title: "Expert Guidance", desc: "Our experienced team provides personalized support throughout your application process." },
    { icon: Clock, title: "Fast Processing", desc: "Streamlined procedures ensure your applications are processed quickly and efficiently." },
    { icon: ShieldCheck, title: "Comprehensive Support", desc: "From initial consultation to final approval, we're with you every step of the way." },
];

/* ── PAGE ── */
export default function InternationalApplicationCentre() {

    return (
        <div
            className="flex flex-col w-full bg-white pt-24 min-h-screen text-slate-900"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >

            {/* ── HERO ── */}
            <section className="relative w-full h-[480px] flex items-end justify-start overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/visa-hero.avif')" }}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-white via-white/55 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-white/65 to-transparent" />
                <div className="pointer-events-none absolute right-[8%] top-[10%] z-10 h-72 w-72 rounded-full border border-amber-400/20" />
                <div className="pointer-events-none absolute right-[8%] top-[10%] z-10 h-48 w-48 translate-x-12 translate-y-12 rounded-full border border-amber-400/15" />

                <div className="relative z-20 container mx-auto px-6 max-w-[1200px] pb-14">
                  
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.08 }}
                        className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-5"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                        International Application <br />
                        <span className="text-amber-500">Centre</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.18 }}
                        className="text-slate-500 max-w-lg mb-8 text-base leading-relaxed"
                    >
                        The International Application Centre provides comprehensive support for visa applications and appointments.
                    </motion.p>
                    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.24 }}
                        className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight tracking-tight mb-2"
                    >
                        Why Us?
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-slate-400 max-w-lg text-sm leading-relaxed mb-5"
                    >
                        We make international applications simple, efficient, and stress-free.
                    </motion.p>
                </div>
            </section>

            {/* ── WHY US STRIP ── */}
            <section className="bg-white py-16 border-b border-slate-100">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {whyUs.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.45 }}
                                    className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:border-amber-200 hover:bg-amber-50"
                                >
                                    <div className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── BOOK APPOINTMENT ── */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                            Book an Appointment
                        </h2>
                        <Link
                            href={APPOINTMENT_BOOKING_ROUTE}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-amber-500"
                        >
                            Click here to book your appointment
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── HOW TO APPLY — STEPS (directly on page, no tabs) ── */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold text-slate-900 mb-10"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                        Steps to Follow
                    </motion.h2>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-8 divide-y divide-slate-100">
                        {infoSteps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05, duration: 0.35 }}
                                className="py-7"
                            >
                                <div className="flex items-start gap-5">
                                    <span className="w-7 text-lg font-light text-slate-400 shrink-0 pt-0.5">
                                        {step.num}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-amber-600 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-slate-500">
                                            {step.body}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── CONTACT ── */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                            Contact Us
                        </h2>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-2xl">
                            Have questions about visa applications or need assistance? Our International Application Centre team is here to help. Reach out to us through any of the contact methods.
                        </p>
                        <Link
                            href="/pages/contact"
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-500"
                        >
                            Contact Us
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── ADDITIONAL INFORMATION ── */}
            <ActionCards />
        </div>
    );
}
