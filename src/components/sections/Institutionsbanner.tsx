"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const allInstitutions = [
  // Belarus
  { name: "Belarusian State University", abbr: "BSU", country: "Belarus" },
  { name: "Belarusian State Medical University", abbr: "BSMU", country: "Belarus" },
  { name: "Belarusian Russian University", abbr: "BRU", country: "Belarus" },
  { name: "Belarusian State University of Culture and Arts", abbr: "BSUCA", country: "Belarus" },
  { name: "Belarus State University of Physical Education", abbr: "BSUPE", country: "Belarus" },
  { name: "Minsk Innovation University", abbr: "MIU", country: "Belarus" },
  { name: "Belarusian National Technical University", abbr: "BNTU", country: "Belarus" },
  { name: "Belarusian State Pedagogical University", abbr: "BSPU", country: "Belarus" },
  { name: "Belarusian State Economic University", abbr: "BSEU", country: "Belarus" },
  { name: "Baranavicki State University", abbr: "BarSU", country: "Belarus" },
  { name: "Minsk State Linguistic University", abbr: "MSLU", country: "Belarus" },
  { name: "Belarusian State Technological University", abbr: "BSTU", country: "Belarus" },
  // Georgia
  { name: "University of Georgia", abbr: "UG", country: "Georgia" },
  { name: "Caucasus University", abbr: "CU", country: "Georgia" },
  { name: "Free University of Tbilisi", abbr: "FUT", country: "Georgia" },
  { name: "International Black Sea University", abbr: "IBSU", country: "Georgia" },
  { name: "Georgian National University", abbr: "SEU", country: "Georgia" },
  { name: "Georgian American University", abbr: "GAU", country: "Georgia" },
  { name: "New Vision University", abbr: "NVU", country: "Georgia" },
  { name: "European University", abbr: "EU", country: "Georgia" },
  { name: "Alte University", abbr: "ALTE", country: "Georgia" },
  { name: "Caucasus International University", abbr: "CIU", country: "Georgia" },
];

function InstitutionCard({ name, abbr, country }: { name: string; abbr: string; country: string }) {
  const isGeorgia = country === "Georgia";
  return (
    <div className="flex items-center gap-3 mx-4 shrink-0">
      {/* Abbr badge */}
      <div
        className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center border ${
          isGeorgia
            ? "border-amber-300 bg-amber-50"
            : "border-slate-300 bg-slate-100"
        }`}
      >
        <span
          className={`text-[8px] font-bold text-center leading-tight px-0.5 break-all ${
            isGeorgia ? "text-amber-600" : "text-slate-600"
          }`}
        >
          {abbr}
        </span>
      </div>
      {/* Text */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap leading-tight">
          {name}
        </span>
        <span
          className={`text-[10px] font-medium uppercase tracking-wide ${
            isGeorgia ? "text-amber-500" : "text-slate-400"
          }`}
        >
          {country}
        </span>
      </div>
      {/* Divider dot */}
      <div className="ml-4 h-1 w-1 rounded-full bg-slate-300 shrink-0" />
    </div>
  );
}



export default function InstitutionsBanner() {
  // Duplicate list for seamless looping
  const doubled = [...allInstitutions, ...allInstitutions];

  return (
    <section className="relative bg-white border-t border-slate-100 py-6 overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-white to-transparent" />

      {/* Label */}
      <div className="relative z-20 text-center mb-12">
         <h2
            className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
            style={serif}
          >
          Featured Institutions
        </h2>
      </div>

      {/* Marquee track */}
      <div className="relative overflow-hidden">
        <div
          className="flex items-center"
          style={{
            animation: "marquee-scroll 55s linear infinite",
            width: "max-content",
          }}
        >
          {doubled.map((inst, i) => (
            <InstitutionCard key={i} name={inst.name} abbr={inst.abbr} country={inst.country} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}