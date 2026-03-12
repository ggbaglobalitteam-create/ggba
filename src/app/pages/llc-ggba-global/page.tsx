"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Building2, GraduationCap, TrendingUp, Briefcase, Users, Calendar, Activity, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import FeaturedPartners from "@/components/sections/FeaturedPartners";
import ActionCards from "@/components/sections/ActionCards";

const additionalItems = [
    { icon: Calendar, title: "Book an appointment", desc: "Schedule your appointment with us", action: "Book now", href: "/pages/contact", isLink: true },
    { icon: Activity, title: "Track your application", desc: "Stay informed of your application status", action: "Track now", href: "#", isLink: false },
    { icon: MapPin, title: "Find a centre", desc: "Information about your local centre", action: "Find now", href: "/pages/contact", isLink: true },
];

/* ─────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────── */
const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

function SectionLabel({ children }: { children: string }) {
    return <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">{children}</p>;
}

function CardHeading({ children }: { children: string }) {
    return <h2 className="text-2xl font-bold text-slate-900 mb-6" style={serif}>{children}</h2>;
}

function ContactBtn({ href = "/pages/contact" }: { href?: string }) {
    return (
        <Link href={href} className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-500 mt-2">
            Contact Us <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}

function CheckList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-amber-500" />
                    <span className="text-sm text-slate-600">{item}</span>
                </li>
            ))}
        </ul>
    );
}

function NumberedList({ items }: { items: string[] }) {
    return (
        <ol className="space-y-2.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[11px] font-bold text-amber-600 border border-amber-200">{i + 1}</span>
                    {item}
                </li>
            ))}
        </ol>
    );
}

function ServiceRow({ title, desc, index }: { title: string; desc: string; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: index * 0.07, duration: 0.4 }}
            className="group flex gap-5 rounded-xl border border-slate-100 bg-slate-50 px-6 py-5 transition-all hover:border-amber-200 hover:bg-amber-50"
        >
            <div className="flex-shrink-0 h-9 w-9 rounded-lg border border-amber-200 bg-amber-50 text-amber-500 text-xs font-bold font-mono flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                {String(index + 1).padStart(2, "0")}
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">{title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
        </motion.div>
    );
}

function ProcessSteps({ steps }: { steps: { title: string; desc: string }[] }) {
    return (
        <div className="space-y-3">
            {steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                    className="flex gap-5 rounded-xl border border-slate-100 bg-white px-6 py-4"
                >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full border-2 border-amber-300 bg-amber-50 text-amber-600 text-xs font-bold flex items-center justify-center">{i + 1}</div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────
   TAB: FOR INTERNATIONAL STUDENTS
───────────────────────────────────────── */
function TabStudents() {
    return (
        <motion.div key="students" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Study in Belarus</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Your pathway to quality education in Eastern Europe</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>Belarus offers international students access to high-quality education at some of Europe's most prestigious universities. With affordable tuition fees, modern facilities, and internationally recognized degrees, Belarus is an excellent choice for your academic journey.</p>
                    <p>Our comprehensive support services help international students navigate every step of the process, from university selection and application to visa processing and arrival in Belarus.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Our Services for Students</h3>
                    <CheckList items={[
                        "University selection and application assistance",
                        "Admission guidance and document preparation",
                        "Student visa processing and support",
                        "Accommodation arrangement",
                        "Airport pickup and orientation",
                        "Language course enrollment",
                        "Health insurance and medical support",
                        "Ongoing academic and personal support",
                    ]} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 pb-3 border-b border-slate-100" style={serif}>Popular Programs</h3>
                    <p className="text-sm text-slate-500 mb-5">Explore the most sought-after fields of study in Belarus</p>
                    <NumberedList items={[
                        "Medicine and Healthcare",
                        "Engineering and Technology",
                        "Business and Economics",
                        "Computer Science and IT",
                        "Architecture and Design",
                        "Natural Sciences",
                        "Languages and Humanities",
                        "Arts and Culture",
                    ]} />
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Admission Requirements</h3>
                <p className="text-sm text-slate-600 mb-5">General requirements for international students applying to Belarusian universities:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {[
                        "Completed secondary education (high school diploma or equivalent)",
                        "Academic transcripts and certificates",
                        "Valid passport",
                        "Medical certificate and health insurance",
                        "Proof of financial support",
                        "Language proficiency (Russian or English, depending on program)",
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-amber-100 px-4 py-3">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                            <span className="text-sm text-slate-600">{item}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 italic border-t border-amber-200 pt-4">Specific requirements may vary by university and program. Contact us for detailed information about your chosen field of study.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3" style={serif}>Next Steps</h3>
                <p className="text-sm text-slate-600 mb-5 max-w-2xl leading-relaxed">Ready to start your educational journey in Belarus? Contact our team to discuss your academic goals and begin the application process. We're here to support you every step of the way.</p>
                <ContactBtn />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   TAB: FOR UNIVERSITIES
───────────────────────────────────────── */
function TabUniversities() {
    const services = [
        { title: "Student Recruitment", desc: "Access our global network of prospective students and benefit from targeted recruitment campaigns." },
        { title: "Application Processing", desc: "We handle the entire application process, from initial inquiry to enrollment, ensuring quality and efficiency." },
        { title: "Marketing Support", desc: "Promote your programs through our marketing channels and international education fairs." },
        { title: "Student Support Services", desc: "We provide ongoing support to international students, helping them succeed academically and socially." },
        { title: "Administrative Assistance", desc: "Streamline administrative tasks related to international student enrollment and compliance." },
    ];

    const benefits = [
        "Increased international student enrollment",
        "Reduced administrative burden",
        "Access to global student markets",
        "Quality assurance in student selection",
        "Enhanced institutional reputation",
        "Comprehensive support services",
        "Marketing and promotional support",
        "Long-term partnership opportunities",
    ];

    const process = [
        { title: "Initial Consultation", desc: "We discuss your institution's goals, programs, and international recruitment needs." },
        { title: "Agreement Development", desc: "We create a customized partnership agreement outlining services, responsibilities, and terms." },
        { title: "Program Setup", desc: "We establish systems for application processing, communication, and student support." },
        { title: "Recruitment Launch", desc: "We begin promoting your programs and processing applications from qualified students." },
        { title: "Ongoing Support", desc: "We provide continuous support, regular reporting, and partnership optimization." },
    ];

    return (
        <motion.div key="universities" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Partnership Programs</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Collaborate with GGBA Global to expand your international reach</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>We partner with universities in Belarus to help them attract and support international students. Our comprehensive services streamline the recruitment process and ensure a smooth experience for both institutions and students.</p>
                    <p>With our extensive network and expertise in international education, we connect your university with qualified students from around the world.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6" style={serif}>Our Services for Universities</h3>
                <div className="space-y-4">
                    {services.map((s, i) => <ServiceRow key={i} title={s.title} desc={s.desc} index={i} />)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Benefits of Partnership</h3>
                    <CheckList items={benefits} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Partnership Process</h3>
                    <ProcessSteps steps={process} />
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Get Started</h3>
                <p className="text-sm text-slate-600 mb-4 max-w-2xl">Interested in partnering with GGBA Global? Contact us to schedule a consultation and learn how we can help your institution grow its international student body.</p>
                <ContactBtn />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   TAB: FOR INVESTORS & BUSINESS
───────────────────────────────────────── */
function TabBusiness() {
    const services = [
        { title: "Company Registration", desc: "Complete support for registering your business entity in Belarus, including legal documentation and compliance." },
        { title: "Market Research", desc: "In-depth analysis of market opportunities, competition, and business potential in your sector." },
        { title: "Legal & Tax Consulting", desc: "Expert guidance on Belarusian business law, taxation, and regulatory requirements." },
        { title: "Office Setup", desc: "Assistance with finding and setting up office space, including lease negotiations and facility management." },
        { title: "Banking & Finance", desc: "Support with opening corporate bank accounts and accessing financing options." },
        { title: "Ongoing Support", desc: "Continuous business support including accounting, HR, and administrative services." },
    ];

    const sectors = [
        "Information Technology", "Manufacturing", "Agriculture & Food Processing",
        "Logistics & Transportation", "Pharmaceuticals", "Renewable Energy",
        "Real Estate Development", "Tourism & Hospitality",
    ];

    const whyInvest = [
        { title: "Strategic Location", desc: "Central position in Europe with access to EU and Eurasian markets." },
        { title: "Skilled Workforce", desc: "Highly educated population with strong technical and language skills." },
        { title: "Competitive Costs", desc: "Lower operational costs compared to Western European countries." },
        { title: "Investment Incentives", desc: "Government programs offering tax benefits and support for foreign investors." },
        { title: "Stable Economy", desc: "Consistent economic growth and business-friendly policies." },
    ];

    return (
        <motion.div key="business" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Business Opportunities in Belarus</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Your gateway to Eastern European markets</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>Belarus offers attractive opportunities for foreign investors and businesses. With its strategic location, skilled workforce, and favorable business environment, Belarus is an ideal destination for business expansion and investment.</p>
                    <p>Our comprehensive business services help international investors and companies establish and grow their presence in Belarus, from initial market research to full operational support.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6" style={serif}>Our Business Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                            className="group rounded-xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-amber-200 hover:bg-amber-50"
                        >
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">{s.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 pb-3 border-b border-slate-100" style={serif}>Investment Sectors</h3>
                    <p className="text-sm text-slate-500 mb-5">Key industries with strong growth potential</p>
                    <NumberedList items={sectors} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Why Invest in Belarus?</h3>
                    <div className="space-y-4">
                        {whyInvest.map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Get Started</h3>
                <p className="text-sm text-slate-600 mb-4 max-w-2xl">Ready to explore business opportunities in Belarus? Contact our team for a consultation. We'll help you assess the market, plan your entry strategy, and support your business every step of the way.</p>
                <ContactBtn />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   TAB: FOR FOREIGN WORKERS
───────────────────────────────────────── */
function TabWorkers() {
    const services = [
        "Work permit and visa processing",
        "Job search and placement assistance",
        "Employment contract review and negotiation",
        "Relocation planning and support",
        "Accommodation assistance",
        "Registration and documentation",
        "Language and cultural orientation",
        "Family support services",
    ];

    const professions = [
        "IT and Software Development", "Engineering", "Healthcare and Medicine",
        "Education and Training", "Finance and Accounting", "Marketing and Sales",
        "Manufacturing and Production", "Hospitality and Tourism",
    ];

    const permitReqs = [
        "Valid passport",
        "Job offer from a Belarusian employer",
        "Educational certificates and professional qualifications",
        "Medical certificate",
        "Criminal background check",
        "Work permit application (processed by employer)",
        "Work visa",
    ];

    const living = [
        { title: "Cost of Living", desc: "Affordable living costs with reasonable prices for housing, food, and transportation." },
        { title: "Healthcare", desc: "Access to quality healthcare services with both public and private options available." },
        { title: "Education", desc: "Good educational facilities for families with children, including international schools." },
        { title: "Transportation", desc: "Efficient public transportation system and well-maintained infrastructure." },
        { title: "Culture & Lifestyle", desc: "Rich cultural heritage, safe environment, and welcoming local community." },
    ];

    return (
        <motion.div key="workers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Work in Belarus</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Professional opportunities and comprehensive support for foreign workers</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>Belarus offers excellent career opportunities for skilled foreign workers across various industries. With competitive salaries, good quality of life, and a welcoming environment, Belarus is an attractive destination for international professionals.</p>
                    <p>We provide comprehensive support for foreign workers, from work permit processing to relocation assistance and ongoing support throughout your employment in Belarus.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Our Services for Workers</h3>
                    <CheckList items={services} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 pb-3 border-b border-slate-100" style={serif}>In-Demand Professions</h3>
                    <p className="text-sm text-slate-500 mb-5">Sectors actively seeking foreign professionals</p>
                    <NumberedList items={professions} />
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Work Permit Requirements</h3>
                <p className="text-sm text-slate-600 mb-5">To work legally in Belarus, foreign nationals typically need:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {permitReqs.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-amber-100 px-4 py-3">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-500" />
                            <span className="text-sm text-slate-600">{item}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 italic border-t border-amber-200 pt-4">Requirements may vary based on your nationality, profession, and type of employment. Contact us for personalized guidance.</p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="bg-slate-900 px-8 py-8">
                    <h3 className="text-xl font-bold text-white" style={serif}>Living in Belarus</h3>
                </div>
                <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {living.map((s, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-amber-200 hover:bg-amber-50 transition-all">
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5">{s.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3" style={serif}>Next Steps</h3>
                <p className="text-sm text-slate-600 mb-4 max-w-2xl">Ready to start your career in Belarus? Contact us to discuss your professional goals and begin the work permit process. We're here to support you throughout your journey.</p>
                <ContactBtn />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   TAB: FOR EMPLOYERS
───────────────────────────────────────── */
function TabEmployers() {
    const services = [
        { title: "Talent Sourcing", desc: "Access our international network to find qualified candidates for your open positions." },
        { title: "Recruitment Process", desc: "Full recruitment support including job posting, screening, interviews, and selection." },
        { title: "Work Permit Processing", desc: "Complete handling of work permit applications and visa processing for foreign hires." },
        { title: "Compliance Support", desc: "Ensure compliance with Belarusian labor laws and immigration regulations." },
        { title: "Onboarding Assistance", desc: "Support for new hires including relocation, accommodation, and orientation." },
        { title: "HR Consulting", desc: "Ongoing HR support for managing international employees and workplace integration." },
    ];

    const benefits = [
        "Access to specialized skills and expertise",
        "Diverse perspectives and innovation",
        "Fill critical skill gaps",
        "Competitive advantage in global markets",
        "Cultural diversity in the workplace",
        "Language capabilities for international business",
        "Flexible workforce solutions",
        "Long-term talent retention",
    ];

    const hiringProcess = [
        { title: "Consultation", desc: "We discuss your hiring needs, job requirements, and timeline." },
        { title: "Candidate Sourcing", desc: "We identify and screen qualified candidates from our international network." },
        { title: "Interview & Selection", desc: "We coordinate interviews and assist with candidate evaluation and selection." },
        { title: "Work Permit Application", desc: "We handle all documentation and processing for work permits and visas." },
        { title: "Onboarding Support", desc: "We assist with relocation and integration of your new employees." },
    ];

    const compliance = [
        "Work permit quota requirements",
        "Employment contract regulations",
        "Social security and tax obligations",
        "Registration and reporting requirements",
        "Labor rights and workplace standards",
    ];

    return (
        <motion.div key="employers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Recruitment & Workforce Solutions</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Find and hire qualified international talent for your business</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>We help Belarusian employers access a global talent pool and navigate the process of hiring foreign workers. Our comprehensive recruitment and compliance services make it easy to build a diverse, skilled workforce.</p>
                    <p>From sourcing candidates to handling work permits and onboarding, we manage the entire process so you can focus on growing your business.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6" style={serif}>Our Services for Employers</h3>
                <div className="space-y-4">
                    {services.map((s, i) => <ServiceRow key={i} title={s.title} desc={s.desc} index={i} />)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Benefits of Hiring Foreign Workers</h3>
                    <CheckList items={benefits} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Hiring Process</h3>
                    <ProcessSteps steps={hiringProcess} />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-10 text-center" style={serif}>Hiring Timeline</h3>
                <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="hidden md:block absolute top-[21px] left-[10%] right-[10%] h-px bg-slate-200 z-0" />
                    {hiringProcess.map((step, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
                            className="relative z-10 text-center"
                        >
                            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-300 bg-white text-sm font-bold text-amber-600 shadow-sm ring-4 ring-slate-50">{i + 1}</div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Legal & Compliance</h3>
                <p className="text-sm text-slate-600 mb-5">We ensure full compliance with Belarusian labor and immigration laws, including:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {compliance.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-amber-100 px-4 py-3">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-500" />
                            <span className="text-sm text-slate-600">{item}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 italic border-t border-amber-200 pt-4 mb-4">Our team stays current with all regulatory changes to ensure your hiring practices remain compliant.</p>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Get Started</h4>
                <p className="text-sm text-slate-600 mb-4">Ready to expand your team with international talent? Contact us to discuss your hiring needs and learn how we can help you build a world-class workforce.</p>
                <ContactBtn />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
const tabs = [
    { id: "students", label: "For International students", icon: GraduationCap },
    { id: "universities", label: "For Universities", icon: Building2 },
    { id: "business", label: "For Investors & Business", icon: TrendingUp },
    { id: "workers", label: "For Foreign Workers", icon: Briefcase },
    { id: "employers", label: "For Employers", icon: Users },
];

const featuredInstitutions = [
    { name: "Belarusian State University", abbr: "BSU", field: "Comprehensive Research University" },
    { name: "Belarusian State Medical University", abbr: "BSMU", field: "Medicine & Healthcare" },
    { name: "Belarusian Russian University", abbr: "BRU", field: "Engineering & Technology" },
    { name: "Belarusian State University of Culture and Arts", abbr: "BSUCA", field: "Culture, Arts & Humanities" },
    { name: "Belarus State University of Physical Education", abbr: "BSUPE", field: "Sports Science & Physical Education" },
    { name: "Minsk Innovation University", abbr: "MIU", field: "Innovation & Business" },
    { name: "Belarusian National Technical University", abbr: "BNTU", field: "Engineering & Technical Sciences" },
    { name: "Belarusian State Pedagogical University", abbr: "BSPU", field: "Education & Pedagogy" },
    { name: "Belarusian State Economic University", abbr: "BSEU", field: "Economics & Business" },
    { name: "Baranavicki State University", abbr: "BarSU", field: "Liberal Arts & Sciences" },
    { name: "Minsk State Linguistic University", abbr: "MSLU", field: "Languages & Linguistics" },
    { name: "Belarusian State Technological University", abbr: "BSTU", field: "Technology & Natural Sciences" },
];

export default function LlcGgbaGlobal() {
    const [activeTab, setActiveTab] = useState("students");

    const whyBelarus = [
        { title: "Quality Education", desc: "Renowned universities offering world-class education at affordable costs." },
        { title: "Business Opportunities", desc: "Growing economy with favorable conditions for foreign investment and business." },
        { title: "Strategic Location", desc: "Central European location providing access to major markets and trade routes." },
    ];

    return (
        <div className="flex flex-col w-full bg-white pt-24 min-h-screen text-slate-900" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

            {/* ── HERO ── */}
            <section className="relative w-full min-h-[620px] flex items-end justify-start overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/network-belarus.png" alt="Belarus" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/65 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-transparent" />
                <div className="pointer-events-none absolute right-[8%] top-[12%] h-64 w-64 rounded-full border border-amber-400/15" />
                <div className="pointer-events-none absolute right-[8%] top-[12%] h-44 w-44 translate-x-10 translate-y-10 rounded-full border border-amber-400/10" />

                <div className="relative z-10 container mx-auto px-6 max-w-[1200px] pb-14">
                    <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }}
                        className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4" style={serif}
                    >
                        LLC GGBA Global,<br /><span className="text-amber-400">Belarus</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }}
                        className="text-slate-300 max-w-lg text-base leading-relaxed mb-10"
                    >
                        Your trusted partner for education, business, and employment in Belarus.
                    </motion.p>

                    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.24 }}
                        className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight mb-2" style={serif}
                    >
                        Why Belarus?
                    </motion.h2>

                    <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-slate-400 max-w-lg text-sm leading-relaxed mb-5"
                    >
                        Discover the advantages of choosing Belarus for your education, business, or career.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl"
                    >
                        {whyBelarus.map((item, i) => (
                            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.08] backdrop-blur-sm px-5 py-4">
                                <h3 className="text-sm font-bold text-amber-400 mb-1">{item.title}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── STICKY TABS ── */}
            <div className="sticky top-[72px] z-40 bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="flex items-center overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`relative whitespace-nowrap px-5 py-4 text-sm font-medium transition-colors ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    {tab.label}
                                    {isActive && (
                                        <motion.span layoutId="belarus-tab-indicator" className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900 rounded-full" />
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
                        {activeTab === "students" && <TabStudents key="students" />}
                        {activeTab === "universities" && <TabUniversities key="universities" />}
                        {activeTab === "business" && <TabBusiness key="business" />}
                        {activeTab === "workers" && <TabWorkers key="workers" />}
                        {activeTab === "employers" && <TabEmployers key="employers" />}
                    </AnimatePresence>
                </div>
            </section>

            {/* ── FEATURED INSTITUTIONS GRID ── */}
       

            {/* ── FEATURED PARTNERS ── */}
            <FeaturedPartners
                label=""
                title="Featured Institutions in Belarus "
                subtitle="Proudly partnering with leading institutions to open doors for students and professionals worldwide."
                partners={featuredInstitutions}
            />

            {/* ── ADDITIONAL INFORMATION ── */}
            {/* <section className="py-20 bg-white border-t border-slate-100">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                        className="text-3xl font-medium text-slate-900 text-center mb-10" style={serif}
                    >
                        Additional Information
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {additionalItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1, duration: 0.45 }}
                                    className="group flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-[0_12px_32px_rgba(245,158,11,0.1)]"
                                >
                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                                    <p className="text-sm text-slate-500 mb-8 flex-grow leading-relaxed">{item.desc}</p>
                                    {item.isLink ? (
                                        <Link href={item.href} className="group/btn flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-500 mt-auto">
                                            {item.action}
                                            <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-0.5" />
                                        </Link>
                                    ) : (
                                        <button className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-500 mt-auto cursor-pointer">
                                            {item.action}
                                            <ArrowRight size={13} />
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section> */}

           <ActionCards />

        </div>
    );
}