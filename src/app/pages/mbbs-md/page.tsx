"use client";

import { useState } from "react";
import { Globe, Clock, ShieldCheck, ArrowRight, CheckCircle2, Plus, Minus, GraduationCap, Stethoscope, MapPin, TrendingUp, AlertCircle, Calendar, Info } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ActionCards from "@/components/sections/ActionCards";

/* ── DATA ── */

const whyUs = [
    { icon: GraduationCap, title: "EU-Recognized Degree", desc: "Georgian MBBS degrees are globally recognized, opening doors to practice across multiple countries." },
    { icon: Clock, title: "Affordable Education", desc: "Significantly lower tuition and living costs compared to private medical colleges in India." },
    { icon: ShieldCheck, title: "English-Medium Instruction", desc: "All coursework is in English, easing the transition and preparation for international licensing exams." },
];

const additionalItems = [
    { icon: Stethoscope, title: "Book a Counselling Session", desc: "Speak with our experts about your post-MBBS options and eligibility.", action: "Book now", href: "/pages/contact", isLink: true },
    { icon: TrendingUp, title: "Track Your Exam Prep", desc: "Stay on top of your FMGE/NEXT preparation milestones.", action: "Track now", href: "#", isLink: false },
    { icon: MapPin, title: "Find a Coaching Centre", desc: "Locate FMGE/NEET-PG coaching centres near you.", action: "Find now", href: "/pages/contact", isLink: true },
];

const infoCards = [
    {
        icon: CheckCircle2,
        color: "text-emerald-500",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50",
        hoverBg: "group-hover:bg-emerald-100",
        title: "Advantages of Georgian MBBS",
        items: [
            "EU-recognized medical degree",
            "Affordable education compared to private colleges in India",
            "English-medium instruction",
            "Potential gateway to European medical practice",
        ],
    },
    {
        icon: Calendar,
        color: "text-blue-500",
        borderColor: "border-blue-200",
        bgColor: "bg-blue-50",
        hoverBg: "group-hover:bg-blue-100",
        title: "Timeline for Career Planning",
        items: [
            "During MBBS: Begin language study if planning to stay in Georgia/Europe",
            "Final Year: Start FMGE preparation if returning to India",
            "Post-Graduation: Apply for licensing exams in target country",
            "1-2 years post-MBBS: Complete required examinations and begin practice",
        ],
    },
    {
        icon: Info,
        color: "text-amber-500",
        borderColor: "border-amber-200",
        bgColor: "bg-amber-50",
        hoverBg: "group-hover:bg-amber-100",
        title: "Important Considerations",
        items: [
            "Language barriers can be significant in non-English speaking countries",
            "Licensing processes can be lengthy and expensive",
            "Cultural adaptation may present challenges",
            "Work-life balance and quality of life vary significantly by location",
        ],
    },
];

const faqSteps = [
    {
        num: 1,
        title: "Is a Georgian MBBS degree recognized worldwide?",
        body: "Georgian medical universities that are recognized by the World Health Organization (WHO) and listed in the World Directory of Medical Schools (WDOMS) have degrees that are technically recognized globally. However, each country has its own licensing requirements that graduates must fulfill to practice medicine there.",
    },
    {
        num: 2,
        title: "How difficult is it to clear the FMGE/NEXT exam?",
        body: "The FMGE has historically had a low pass rate (15-25%) for foreign medical graduates. Success requires dedicated preparation, strong fundamentals, and familiarity with the Indian medical curriculum and practice standards. The upcoming NEXT exam is expected to be similarly challenging.",
    },
    {
        num: 3,
        title: "Can I directly move to the US or UK after MBBS in Georgia?",
        body: "Yes, but you must complete additional examinations. For the US, you need to pass the USMLE Steps 1, 2CK, and 2CS, and then apply for residency through the Match process. For the UK, you need to clear the PLAB exams or obtain GMC registration through other recognized pathways.",
    },
    {
        num: 4,
        title: "What are the language requirements for practicing in Georgia?",
        body: "To practice medicine in Georgia, proficiency in the Georgian language is essential. This typically requires at least B2 level proficiency, which allows you to communicate effectively with patients and colleagues. Some hospitals in major cities may have positions where English is used, but these are limited.",
    },
    {
        num: 5,
        title: "How does the cost of living compare between Georgia, India, and Western Europe?",
        body: "The cost of living in Georgia is generally higher than in India but significantly lower than in Western European countries. In Georgia, monthly expenses for a comfortable lifestyle might range from $500-800, while in Western Europe, this could be $1,500-2,500 depending on the city. This should be factored in when comparing salary offers.",
    },
];

const returnSteps = [
    "Complete a one-year internship (if not already done)",
    "Register with the State Medical Council",
    "Register with the State Medical Council",
    "Practice as a general physician",
    "Prepare for NEET-PG for specialization",
];

const europeSteps = [
    "Verify degree recognition in your target EU country",
    "Achieve required language proficiency (B2/C1 level — German, French, etc.)",
    "Complete credential evaluation with local medical authority",
    "Clear any country-specific licensing examinations (knowledge, clinical skills)",
    "Apply for residency or specialist training programs",
];

/* ── ACCORDION ITEM ── */
function AccordionItem({ step, index }: { step: typeof faqSteps[0]; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            className="border-b border-slate-200 last:border-b-0"
        >
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center gap-5 py-5 text-left group"
            >
                <span className="w-7 text-lg font-light text-slate-400 shrink-0">{step.num}</span>
                <span className={`flex-1 text-base font-medium transition-colors ${open ? "text-amber-600" : "text-slate-700 group-hover:text-slate-900"}`}>
                    {step.title}
                </span>
                <span className={`shrink-0 transition-colors ${open ? "text-amber-500" : "text-slate-400"}`}>
                    {open ? <Minus size={16} /> : <Plus size={16} />}
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 pl-12 pr-6 text-sm leading-relaxed text-slate-500">{step.body}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ── TAB PANELS ── */

function TabReturnIndia() {
    return (
        <motion.div key="india" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Returning to India
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                    <h6 className="text-md font-bold text-slate-900 mb-4">FMGE/NEXT Examination</h6>
                    <p>Indian students must clear the Foreign Medical Graduate Examination (FMGE) or the upcoming National Exit Test (NEXT) to practice in India.</p>

                </div>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                    <h6 className="text-md font-bold text-slate-900 mb-4">Success Rate</h6>
                    <p>The FMGE has historically had a low pass rate (15-25%), so thorough preparation is essential.</p>

                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Post-FMGE Options
                </h2>
                <p className="text-sm text-slate-500 mb-6">After clearing FMGE:</p>
                <ul className="space-y-3">
                    {returnSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-amber-500" />
                            <span className="text-sm text-slate-600">{step}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Start Your Preparation
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Ready to map out your return to India? Our counsellors can help you build a personalised FMGE preparation plan and connect you with the right resources.
        </p>
        <Link href="/pages/contact" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-500">
          Contact Us <ArrowRight size={14} />
        </Link>
      </div> */}
        </motion.div>
    );
}

function TabStayGeorgia() {
    return (
        <motion.div key="georgia" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Staying in Georgia
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                    <h6 className="text-md font-bold text-slate-900 mb-4">Language Requirement</h6>
                    <p>Proficiency in Georgian language is essential for medical practice.</p>

                </div>

            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Licensing &amp; Residency
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                    <h6 className="text-md font-bold text-slate-900 mb-4">Licensing Process</h6>
                    <p>To practice in Georgia:</p>

                </div>
                <ul className="space-y-3 mt-4">
                    {[
                        "Pass the Georgian medical licensing examination",
                        "Complete required documentation and verification",
                        "Register with the Georgian Medical Association",

                    ].map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-amber-500" />
                            <span className="text-sm text-slate-600">{s}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Residency Options
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">

                    <p>Residency programs are available but competitive and typically require Georgian language proficiency.</p>

                </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Visa/Residence Permit
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">

                    <p>Work visa or residence permit can be obtained based on employment. Temporary residence permits are typically valid for 1-6 years.</p>

                </div>

            </div>
        </motion.div>
    );
}

function TabMoveEurope() {
    return (
        <motion.div key="europe" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Moving to Europe
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                    <h6 className="text-md font-bold text-slate-900 mb-4">Schengen Opportunities</h6>
                    <p>A Georgian medical degree is recognized in the EU, but additional requirements apply:</p>

                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Language Requirements
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">

                    <p>Proficiency in the local language (B2/C1 level) is typically required for medical practice in most European countries.</p>

                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Licensing &amp; Residency
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                    <h6 className="text-md font-bold text-slate-900 mb-4">Licensing Process</h6>
                    <p>Each European country has its own medical licensing process:</p>

                </div>
                <ul className="space-y-3 mt-4">
                    {[
                        "Credential verification",
                        "Medical knowledge examination",
                        "Clinical skills assessment",
                        "Language proficiency test"

                    ].map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-amber-500" />
                            <span className="text-sm text-slate-600">{s}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Work Visa Requirements
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">

                    <p>Work visa requirements vary by country but typically require a job offer from a healthcare institution.</p>

                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Popular Destinations
                </h2>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">

                    <p>Germany, Sweden, and Norway have relatively more opportunities for international medical graduates.</p>

                </div>
            </div>
        </motion.div>
    );
}

function TabEarnings() {
    const data = [
        { location: "India", position: "Junior Doctor", salary: "$500 - $1,000", note: "After FMGE clearance; varies by state/institution" },
        { location: "India", position: "Specialist (Post-PG)", salary: "$1,500 - $3,000+", note: "After specialization; higher in private sector" },
        { location: "Georgia", position: "Junior Doctor", salary: "$600 - $1,200", note: "Requires Georgian language proficiency" },
        { location: "Georgia", position: "Specialist", salary: "$1,200 - $2,500", note: "After residency/specialization" },
        { location: "Germany", position: "Resident Doctor", salary: "$4,000 - $5,500", note: "Requires German language (B2/C1)" },
        { location: "UK", position: "Junior Doctor", salary: "$3,000 - $4,500", note: "Requires PLAB exam clearance" },
    ];
    return (
        <motion.div key="earnings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Expected Earnings
                </h2>
                <p className="text-sm text-slate-500 mb-6">Indicative monthly salary ranges across regions and career stages (USD)</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="px-5 py-3.5 text-left font-semibold text-slate-700 border border-slate-200 bg-slate-50 w-1/4">Location</th>
                                <th className="px-5 py-3.5 text-left font-semibold text-slate-700 border border-slate-200 bg-slate-50 w-1/4">Position</th>
                                <th className="px-5 py-3.5 text-left font-semibold text-slate-700 border border-slate-200 bg-slate-50 w-1/4">Monthly Salary Range (USD)</th>
                                <th className="px-5 py-3.5 text-left font-semibold text-slate-700 border border-slate-200 bg-slate-50 w-1/4">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4 text-slate-600 border border-slate-200">{item.location}</td>
                                    <td className="px-5 py-4 text-slate-600 border border-slate-200">{item.position}</td>
                                    <td className="px-5 py-4 text-slate-600 border border-slate-200">{item.salary}</td>
                                    <td className="px-5 py-4 text-slate-500 border border-slate-200">{item.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-6 text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                    <AlertCircle size={12} className="mt-0.5 shrink-0 text-slate-400" />
                    <span><strong className="text-slate-500">Note:</strong> These figures are approximate and can vary based on location, experience, specialization, and type of healthcare facility. Cost of living should also be considered when comparing salaries across different countries.</span>
                </p>
            </div>
        </motion.div>
    );
}

function TabFAQ() {
    return (
        <motion.div key="faq" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200 px-8">
                {faqSteps.map((step, i) => (
                    <AccordionItem key={i} step={step} index={i} />
                ))}
            </div>
        </motion.div>
    );
}

/* ── PAGE ── */
export default function CareerPathways() {
    const [activeTab, setActiveTab] = useState("india");

    const tabs = [
        { id: "india", label: "Return to India" },
        { id: "georgia", label: "Stay in Georgia" },
        { id: "europe", label: "Move to Europe" },
        { id: "earnings", label: "Expected Earnings" },

    ];

    return (
        <div
            className="flex flex-col w-full bg-white pt-24 min-h-screen text-slate-900"
            style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
        >

            {/* ── HERO BANNER ── */}
            <section className="relative w-full min-h-[580px] flex items-center justify-start overflow-hidden">

                {/* Photo layer — shows when image is present */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/mbbs-georgia-hero.avif')" }}
                />

                {/* Rich CSS fallback gradient (also visible as tint over photo) */}
                <div
                    className="absolute inset-0 z-[1]"
                    style={{
                        background:
                            "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1a2640 65%, #2d1f0e 100%)",
                    }}
                />

                {/* Warm amber light bloom — bottom left */}
                <div
                    className="absolute bottom-0 left-0 z-[2] h-[420px] w-[420px] -translate-x-1/4 translate-y-1/4 rounded-full opacity-30"
                    style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
                />

                {/* Cool teal accent — top right */}
                <div
                    className="absolute top-0 right-0 z-[2] h-[340px] w-[340px] translate-x-1/4 -translate-y-1/4 rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
                />

                {/* Subtle noise texture overlay */}
                <div
                    className="absolute inset-0 z-[3] opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                        backgroundSize: "200px 200px",
                    }}
                />

                {/* Left-to-right dark fade so text stays legible */}
                <div className="absolute inset-0 z-[4] bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent" />

                {/* Bottom fade to white for smooth section transition */}
                <div className="absolute inset-x-0 bottom-0 z-[5] h-28 bg-gradient-to-t from-white to-transparent" />

                {/* Decorative rings — right side */}
                <div className="pointer-events-none absolute right-[6%] top-1/2 z-[6] -translate-y-1/2 h-80 w-80 rounded-full border border-amber-400/15" />
                <div className="pointer-events-none absolute right-[6%] top-1/2 z-[6] -translate-y-1/2 h-56 w-56 translate-x-12 rounded-full border border-amber-400/10" />
                <div className="pointer-events-none absolute right-[6%] top-1/2 z-[6] -translate-y-1/2 h-36 w-36 translate-x-20 rounded-full border border-sky-400/10" />

                {/* Horizontal rule accent */}
                <div className="pointer-events-none absolute left-0 top-1/2 z-[6] h-px w-1/3 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

                {/* Content */}
                <div className="relative z-10 container mx-auto px-6 max-w-[1200px] py-24">
                    {/* <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 backdrop-blur-sm"
          >
            <Globe size={12} className="text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">A Guide for Indian Medical Students</span>
          </motion.div> */}

                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.08 }}
                        className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                        Career Pathways<br />
                        <span
                            className="inline-block"
                            style={{
                                background: "linear-gradient(90deg, #fbbf24 0%, #f97316 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            After MBBS in Georgia
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.18 }}
                        className="text-slate-300 max-w-xl mb-10 text-base leading-relaxed"
                    >
                        A Guide for Indian Medical Students
                    </motion.p>

                    {/* Stat pills */}
                    {/* <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-wrap gap-3"i sare  
          >
            {[
              { label: "WHO-Recognized Universities", value: "✓" },
              { label: "FMGE Pass Rate", value: "15–25%" },
              { label: "EU-Adjacent Degree", value: "✓" },
              { label: "English-Medium", value: "✓" },
            ].map((stat, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
              >
                <span className="text-xs font-semibold text-amber-400">{stat.value}</span>
                <span className="text-xs text-slate-300">{stat.label}</span>
              </div>
            ))}
          </motion.div> */}

                    {/* Why Georgia sub-heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.38 }}
                        className="mt-10 pt-8 border-t border-white/10"
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Overview for Indian Medical Graduates</p>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                            Completing an MBBS in Georgia opens several pathways for Indian students. However, it's important to understand that options vary based on licensing requirements, language proficiency, and additional qualifications.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── WHY GEORGIA STRIP ── */}
            {/* <section className="bg-white py-16 border-b border-slate-100">
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
      </section> */}

            {/* ── STICKY TABS ── */}
            <div className="sticky top-[72px] z-40 bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="flex items-center overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative whitespace-nowrap px-5 py-4 text-sm font-medium transition-colors ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    {tab.label}
                                    {isActive && (
                                        <motion.span
                                            layoutId="tab-indicator"
                                            className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900 rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── TAB CONTENT ── */}
            <section className="py-10 bg-slate-50 flex-1">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <AnimatePresence mode="wait">
                        {activeTab === "india" && <TabReturnIndia key="india" />}
                        {activeTab === "georgia" && <TabStayGeorgia key="georgia" />}
                        {activeTab === "europe" && <TabMoveEurope key="europe" />}
                        {activeTab === "earnings" && <TabEarnings key="earnings" />}

                    </AnimatePresence>
                </div>
            </section>

            {/* ── INFO CARDS (Advantages / Timeline / Considerations) ── */}
            <section className="py-20 bg-white border-t border-slate-100">
                <div className="container mx-auto px-6 max-w-[1200px]">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {infoCards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.45 }}
                                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-md"
                                >
                                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${card.borderColor} ${card.bgColor} ${card.color} ${card.hoverBg} transition-colors`}>
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">{card.title}</h3>
                                    <ul className="space-y-2.5">
                                        {card.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${card.bgColor} border ${card.borderColor}`} />
                                                <span className="text-sm text-slate-500 leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* faq */}

            {/* ── FAQ SECTION ── */}
            <section className="py-20 bg-white border-t border-slate-100">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="mb-10 text-center"
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Got Questions?</p>
                        <h2
                            className="text-3xl font-medium text-slate-900"
                            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                        >
                            Frequently Asked Questions
                        </h2>
                    </motion.div>
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200 px-8">
                        {faqSteps.map((step, i) => (
                            <AccordionItem key={i} step={step} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ADDITIONAL INFORMATION ── */}
            <ActionCards />
        </div>
    );
}