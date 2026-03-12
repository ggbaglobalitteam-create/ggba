"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, GraduationCap, Stethoscope, TrendingUp, MapPin, Calendar, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import FeaturedPartners from "@/components/sections/FeaturedPartners";
import ActionCards from "@/components/sections/ActionCards";


const additionalItems = [
    { icon: Calendar, title: "Book an appointment", desc: "Schedule your appointment with us", action: "Book now", href: "/pages/contact", isLink: true },
    { icon: Activity, title: "Track your application", desc: "Stay informed of your application status", action: "Track now", href: "#", isLink: false },
    { icon: MapPin, title: "Find a centre", desc: "Information about your local centre", action: "Find now", href: "/pages/contact", isLink: true },
];

const georgiaInstitutions = [
    { name: "University of Georgia", abbr: "UG", field: "Comprehensive Private University" },
    { name: "Caucasus University", abbr: "CU", field: "International Partnerships & Business" },
    { name: "Free University of Tbilisi", abbr: "FUT", field: "Law, Business & Economics" },
    { name: "International Black Sea University", abbr: "IBSU", field: "International Programs" },
    { name: "Georgian National University", abbr: "SEU", field: "Modern Campus & Wide Programs" },
    { name: "Georgian American University", abbr: "GAU", field: "American-Standard Curriculum" },
    { name: "New Vision University", abbr: "NVU", field: "Medicine & Research" },
    { name: "European University", abbr: "EU", field: "International Medicine & Healthcare" },
    { name: "Alte University", abbr: "ALTE", field: "International School of Medicine" },
    { name: "Caucasus International University", abbr: "CIU", field: "IT, Business & International Programs" },
];

/* ─────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────── */
const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

function SectionLabel({ children }: { children: string }) {
    return <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">{children}</p>;
}

function ContactBtn({ label = "Contact Us", href = "/pages/contact" }: { label?: string; href?: string }) {
    return (
        <Link href={href} className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-500">
            {label} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
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

/* ─────────────────────────────────────────
   TAB: STUDY IN GEORGIA
───────────────────────────────────────── */
function TabStudy() {
    const whyStudy = [
        { title: "Affordable Tuition", desc: "Competitive tuition fees and low cost of living compared to Western countries." },
        { title: "Quality Education", desc: "Internationally recognized degrees from accredited universities with modern facilities." },
        { title: "English Programs", desc: "Wide range of programs taught in English, making education accessible to international students." },
        { title: "Safe Environment", desc: "Georgia is known for its safety, hospitality, and welcoming attitude toward international students." },
        { title: "Cultural Experience", desc: "Rich history, diverse culture, and stunning natural beauty provide a unique student experience." },
    ];

    return (
        <motion.div key="study" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Education in Georgia</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Quality education at internationally recognized institutions</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>Georgia has emerged as a popular destination for international students seeking quality education at affordable costs. With a rich academic tradition, modern facilities, and English-taught programs, Georgian universities offer excellent opportunities for students from around the world.</p>
                    <p>Our comprehensive support services help international students navigate the application process, secure admission, and settle into their new academic environment in Georgia.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Our Services for Students</h3>
                    <CheckList items={[
                        "University selection and program guidance",
                        "Application and admission support",
                        "Student visa processing",
                        "Accommodation assistance",
                        "Airport pickup and orientation",
                        "Registration and documentation",
                        "Language support services",
                        "Ongoing academic and personal support",
                    ]} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 pb-3 border-b border-slate-100" style={serif}>Popular Fields of Study</h3>
                    <p className="text-sm text-slate-500 mb-5">Explore diverse academic programs offered in Georgia</p>
                    <NumberedList items={[
                        "Nursing", "Medicine", "Business Administration",
                        "Computer Science & IT", "Engineering", "International Relations",
                        "Tourism & Hospitality", "Architecture", "Law", "Arts & Humanities",
                    ]} />
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Admission Requirements</h3>
                <p className="text-sm text-slate-600 mb-5">General requirements for international students:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {[
                        "High school diploma or equivalent (for undergraduate programs)",
                        "Bachelor's degree (for graduate programs)",
                        "Academic transcripts and certificates",
                        "Valid passport",
                        "English language proficiency (IELTS/TOEFL or equivalent)",
                        "Motivation letter",
                        "Medium of Instruction (MOI) letter from previous education provider (if IELTS/TOEFL not available).",
                        "Police clearance certificate",
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-amber-100 px-4 py-3">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                            <span className="text-sm text-slate-600">{item}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 italic border-t border-amber-200 pt-4">Specific requirements vary by university and program. Contact us for detailed information about your chosen field of study.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6" style={serif}>Why Study in Georgia?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {whyStudy.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                            className={`rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-amber-200 hover:bg-amber-50 transition-all ${i === 4 ? "md:col-span-2 lg:col-span-2" : ""}`}
                        >
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5">{item.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3" style={serif}>Next Steps</h3>
                <p className="text-sm text-slate-600 mb-5 max-w-2xl leading-relaxed">Ready to begin your educational journey in Georgia? Contact us to discuss your academic goals and start the application process. We're here to guide you every step of the way.</p>
                <ContactBtn />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   TAB: MBBS/MD
───────────────────────────────────────── */
function TabMBBS() {
    return (
        <motion.div key="mbbs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>MBBS / MD in Georgia</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Overview for Indian Medical Graduates</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>Completing an MBBS in Georgia opens several pathways for Indian students. However, it's important to understand that options vary based on licensing requirements, language proficiency, and additional qualifications.</p>
                </div>
                <div className="mt-6">
                    <Link
                        href="/pages/mbbs-md"
                        className="group inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
                    >
                        Click here to check more details
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   TAB: BUSINESS IN GEORGIA
───────────────────────────────────────── */
function TabBusiness() {
    const services = [
        { title: "Company Formation", desc: "Complete support for registering your business in Georgia, including legal entity selection and documentation." },
        { title: "Business Consulting", desc: "Strategic advice on market entry, business planning, and growth strategies tailored to the Georgian market." },
        { title: "Legal & Tax Services", desc: "Expert guidance on Georgian business law, taxation, and regulatory compliance." },
        { title: "Office Solutions", desc: "Assistance with finding office space, virtual office services, and facility setup." },
        { title: "Banking & Finance", desc: "Support with opening corporate bank accounts and accessing financing options." },
        { title: "Accounting & Bookkeeping", desc: "Professional accounting services ensuring compliance with Georgian financial regulations." },
    ];

    const sectors = [
        "Tourism & Hospitality", "Information Technology", "Agriculture & Wine",
        "Real Estate Development", "Manufacturing", "Logistics & Transportation",
        "Financial Services", "Renewable Energy",
    ];

    const whyBusiness = [
        { title: "Easy Business Registration", desc: "Company registration can be completed in just one day with minimal bureaucracy." },
        { title: "Low Tax Rates", desc: "Competitive corporate tax rates and various tax incentives for businesses." },
        { title: "Strategic Location", desc: "Bridge between Europe and Asia with access to markets of over 2 billion people." },
        { title: "Free Trade Agreements", desc: "Access to EU, CIS, and other markets through comprehensive free trade agreements." },
        { title: "Skilled Workforce", desc: "Well-educated, multilingual workforce at competitive labor costs." },
        { title: "Modern Infrastructure", desc: "Developed infrastructure including ports, airports, and digital connectivity." },
    ];

    const setupProcess = [
        { title: "Initial Consultation", desc: "We discuss your business goals, assess market opportunities, and develop an entry strategy." },
        { title: "Company Registration", desc: "We handle all legal documentation and registration procedures with Georgian authorities." },
        { title: "Banking & Tax Setup", desc: "We assist with opening corporate bank accounts and registering for tax purposes." },
        { title: "Office & Operations", desc: "We help establish your physical presence and set up operational infrastructure." },
        { title: "Ongoing Support", desc: "We provide continuous support for accounting, compliance, and business development." },
    ];

    return (
        <motion.div key="business" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Business Opportunities in Georgia</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>A gateway to regional markets with favorable business conditions</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>Georgia has established itself as one of the most business-friendly countries in the region. With its strategic location, liberal economic policies, low taxes, and simplified regulations, Georgia offers excellent opportunities for entrepreneurs and investors.</p>
                    <p>Our comprehensive business services help international companies and investors establish and grow their presence in Georgia, from company registration to ongoing operational support.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6" style={serif}>Our Business Services</h3>
                <div className="space-y-4">
                    {services.map((s, i) => <ServiceRow key={i} title={s.title} desc={s.desc} index={i} />)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 pb-3 border-b border-slate-100" style={serif}>Key Business Sectors</h3>
                    <p className="text-sm text-slate-500 mb-5">Industries with strong growth potential in Georgia</p>
                    <NumberedList items={sectors} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Why Do Business in Georgia?</h3>
                    <div className="space-y-4">
                        {whyBusiness.map((item, i) => (
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

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-10 text-center" style={serif}>Business Setup Process</h3>
                <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="hidden md:block absolute top-[21px] left-[10%] right-[10%] h-px bg-slate-200 z-0" />
                    {setupProcess.map((step, i) => (
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
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Get Started</h3>
                <p className="text-sm text-slate-600 mb-4 max-w-2xl">Ready to explore business opportunities in Georgia? Contact our team for a consultation.</p>
                <ContactBtn />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   TAB: TOURISM IN GEORGIA
───────────────────────────────────────── */
function TabTourism() {
    const tourismServices = [
        { title: "Tour Planning", desc: "Customized itineraries tailored to your interests, budget, and travel style." },
        { title: "Visa Assistance", desc: "Support with visa requirements and travel documentation for Georgia." },
        { title: "Accommodation Booking", desc: "Hotel reservations, guesthouses, and unique accommodation options across Georgia." },
        { title: "Transportation", desc: "Airport transfers, car rentals, and organized transportation for tours." },
        { title: "Guided Tours", desc: "Professional guides for cultural sites, wine regions, and adventure activities." },
        { title: "Activity Booking", desc: "Reservations for wine tastings, cooking classes, hiking, skiing, and more." },
    ];

    const destinations = [
        { name: "Tbilisi", desc: "The vibrant capital city blending old-world charm with modern energy, featuring historic architecture, sulfur baths, and lively nightlife." },
        { name: "Kazbegi", desc: "Dramatic mountain scenery in the Greater Caucasus, home to the iconic Gergeti Trinity Church and excellent hiking trails." },
        { name: "Kakheti Wine Region", desc: "Georgia's premier wine region with ancient winemaking traditions, vineyard tours, and wine tastings." },
        { name: "Batumi", desc: "Modern Black Sea resort city with beaches, botanical gardens, and contemporary architecture." },
        { name: "Svaneti", desc: "Remote mountain region with medieval towers, UNESCO World Heritage sites, and pristine alpine landscapes." },
        { name: "Mtskheta", desc: "Ancient capital and spiritual heart of Georgia, featuring UNESCO-listed churches and monasteries." },
    ];

    const whyVisit = [
        { title: "Rich History & Culture", desc: "3,000 years of history with ancient churches, fortresses, and UNESCO World Heritage sites." },
        { title: "Legendary Hospitality", desc: "Georgians are renowned for their warm welcome and generous hospitality toward guests." },
        { title: "Diverse Landscapes", desc: "From mountains to beaches, Georgia offers incredible natural diversity in a compact area." },
        { title: "World-Class Wine", desc: "Birthplace of wine with 8,000-year winemaking tradition and unique grape varieties." },
        { title: "Delicious Cuisine", desc: "Distinctive Georgian cuisine featuring khachapuri, khinkali, and other culinary delights." },
        { title: "Affordable Travel", desc: "Excellent value for money with reasonable prices for accommodation, food, and activities." },
    ];

    const activities = [
        "Wine tasting tours", "Hiking and trekking", "Skiing and snowboarding",
        "Cultural heritage tours", "Georgian cooking classes", "Sulfur bath experiences",
        "Paragliding and adventure sports", "Black Sea beach relaxation",
    ];

    const travelInfo = [
        { title: "Best Time to Visit", desc: "Spring (April-June) and autumn (September-October) offer pleasant weather. Summer is ideal for mountain and beach destinations, while winter is perfect for skiing." },
        { title: "Visa Requirements", desc: "Many nationalities can enter Georgia visa-free for up to one year. Check specific requirements for your country." },
        { title: "Currency", desc: "Georgian Lari (GEL). Credit cards are widely accepted in cities, but cash is useful in rural areas." },
        { title: "Language", desc: "Georgian is the official language. English is increasingly spoken in tourist areas, and Russian is also understood." },
    ];

    return (
        <motion.div key="tourism" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <SectionLabel>Discover Georgia</SectionLabel>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" style={serif}>Where ancient history meets stunning natural beauty</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600 max-w-3xl">
                    <p>Georgia is a hidden gem at the crossroads of Europe and Asia, offering visitors an unforgettable blend of ancient culture, breathtaking landscapes, world-renowned cuisine, and legendary hospitality.</p>
                    <p>Our tourism services help visitors plan and experience the best of Georgia, whether you're seeking adventure, cultural immersion, wine tours, or relaxation.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6" style={serif}>Our Tourism Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tourismServices.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                            className="group rounded-xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-amber-200 hover:bg-amber-50"
                        >
                            <h4 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">{s.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2 pb-3 border-b border-slate-100" style={serif}>Must-Visit Destinations</h3>
                <p className="text-sm text-slate-500 mb-6">Explore Georgia's most iconic locations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {destinations.map((dest, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}
                            className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 hover:border-amber-200 hover:bg-amber-50 transition-all"
                        >
                            <MapPin size={15} className="mt-0.5 shrink-0 text-amber-500" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-1">{dest.name}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">{dest.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Popular Activities</h3>
                    <NumberedList items={activities} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100" style={serif}>Why Visit Georgia?</h3>
                    <div className="space-y-4">
                        {whyVisit.map((item, i) => (
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

            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="bg-slate-900 px-8 py-8">
                    <h3 className="text-xl font-bold text-white" style={serif}>Travel Information</h3>
                </div>
                <div className="bg-white p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {travelInfo.map((info, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                            <h4 className="text-sm font-bold text-amber-600 mb-2">{info.title}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{info.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={serif}>Plan Your Trip</h3>
                <p className="text-sm text-slate-600 mb-4 max-w-2xl">Ready to experience the magic of Georgia? Contact us to start planning your Georgian adventure.</p>
                <ContactBtn label="Contact Us" />
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
const tabs = [
    { id: "study", label: "Study in Georgia", icon: GraduationCap },
    { id: "mbbs", label: "MBBS/MD", icon: Stethoscope },
    { id: "business", label: "Business in Georgia", icon: TrendingUp },
    { id: "tourism", label: "Tourism in Georgia", icon: MapPin },
];

export default function SbGeorgiaLlc() {
    const [activeTab, setActiveTab] = useState("study");

    const whyGeorgia = [
        { title: "Affordable Excellence", desc: "High-quality services and education at competitive prices compared to Western countries." },
        { title: "Strategic Location", desc: "Bridge between Europe and Asia with excellent connectivity and business potential." },
        { title: "Rich Culture", desc: "Ancient heritage, stunning landscapes, and renowned hospitality create a unique experience." },
    ];

    return (
        <div className="flex flex-col w-full bg-white pt-24 min-h-screen text-slate-900" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

            {/* ── HERO ── */}
            <section className="relative w-full min-h-[620px] flex items-end justify-start overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/network-georgia.png" alt="Georgia" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/65 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-transparent" />
                <div className="pointer-events-none absolute right-[8%] top-[12%] h-64 w-64 rounded-full border border-amber-400/15" />
                <div className="pointer-events-none absolute right-[8%] top-[12%] h-44 w-44 translate-x-10 translate-y-10 rounded-full border border-amber-400/10" />

                <div className="relative z-10 container mx-auto px-6 max-w-[1200px] pb-14">
                    <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }}
                        className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4" style={serif}
                    >
                        LLC S.B. Georgia,<br /><span className="text-amber-400">Georgia</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.18 }}
                        className="text-slate-300 max-w-lg text-base leading-relaxed mb-10"
                    >
                        Your gateway to education, healthcare, business, and tourism in Georgia.
                    </motion.p>

                    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.24 }}
                        className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight mb-2" style={serif}
                    >
                        Why Georgia?
                    </motion.h2>

                    <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-slate-400 max-w-lg text-sm leading-relaxed mb-5"
                    >
                        Georgia offers unique opportunities for education, business, and exploration.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.36 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl"
                    >
                        {whyGeorgia.map((item, i) => (
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
                                        <motion.span layoutId="georgia-tab-indicator" className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900 rounded-full" />
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
                        {activeTab === "study" && <TabStudy key="study" />}
                        {activeTab === "mbbs" && <TabMBBS key="mbbs" />}
                        {activeTab === "business" && <TabBusiness key="business" />}
                        {activeTab === "tourism" && <TabTourism key="tourism" />}
                    </AnimatePresence>
                </div>
            </section>

            {/* ── FEATURED INSTITUTIONS ── */}
            <FeaturedPartners
                label="Partner Institutions"
                title="Featured Institutions in Georgia"
                subtitle="We work with Georgia's most respected universities to connect students with world-class academic opportunities."
                partners={georgiaInstitutions}
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