"use client";

import { motion } from "framer-motion";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const defaultPartners = [
  { name: "Northbridge University", abbr: "NU", field: "Research University" },
  { name: "Stellar Medical College", abbr: "SMC", field: "Medicine & Healthcare" },
  { name: "Eastland Institute of Technology", abbr: "EIT", field: "Engineering & Technology" },
  { name: "Westford International College", abbr: "WIC", field: "Business & Finance" },
  { name: "Caspian School of Business", abbr: "CSB", field: "Economics & Business" },
  { name: "Georgian Academy of Health", abbr: "GAH", field: "Health Sciences" },
  { name: "Belarus State Learning Hub", abbr: "BSLH", field: "Liberal Arts & Sciences" },
  { name: "Global Frontier University", abbr: "GFU", field: "Innovation & Technology" },
];

interface Partner {
  name: string;
  abbr?: string;
  image?: string;
  field?: string;
}

interface FeaturedPartnersProps {
  partners?: Partner[];
  title?: string;
  subtitle?: string;
  label?: string;
}

export default function FeaturedPartners({
  partners = defaultPartners,
  title = "Featured Partners",
  subtitle = "A curated selection of institutions we proudly collaborate with.",
  label = "Trusted Network",
}: FeaturedPartnersProps) {
  return (
    <section
      className="relative bg-white py-20"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      {/* Subtle glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-amber-50/60 blur-3xl" />

      <div className="relative mx-auto max-w-[1200px] px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-500">
            {label}
          </p>
          <h2
            className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
            style={serif}
          >
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            {subtitle}
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner, i) => {
            // Generate abbreviation from name if not provided
            const abbr =
              partner.abbr ??
              partner.name
                .split(" ")
                .filter((w) => w.length > 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 5);

            return (
              <motion.div
                key={partner.name + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:bg-white hover:shadow-[0_8px_24px_rgba(245,158,11,0.08)]"
              >
                {/* Abbr badge */}
                <div className="flex-shrink-0 h-12 w-12 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <span className="text-[9px] font-bold text-amber-600 text-center leading-tight px-1 break-all">
                    {abbr}
                  </span>
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-amber-700 transition-colors">
                    {partner.name}
                  </h3>
                  {partner.field && (
                    <p className="mt-0.5 text-xs text-slate-500">{partner.field}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}