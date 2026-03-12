"use client";

import { useEffect } from "react";

type PublicCertificateActionsProps = {
  autoPrint?: boolean;
};

export function PublicCertificateActions({ autoPrint = false }: PublicCertificateActionsProps) {
  useEffect(() => {
    if (!autoPrint) return;
    const id = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(id);
  }, [autoPrint]);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center justify-center rounded-xl bg-[#1B2340] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3560]"
      >
        Print or Save as PDF
      </button>
      <p className="text-center text-sm text-slate-500">
        Use your browser&apos;s Save as PDF option to keep the certificate design exactly as shown.
      </p>
    </div>
  );
}
