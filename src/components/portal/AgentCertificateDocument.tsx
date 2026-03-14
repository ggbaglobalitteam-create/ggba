import React from "react";

import { AgentCertificateData } from "@/lib/agentCertificate";

type AgentCertificateDocumentProps = {
  data: AgentCertificateData;
  qrTargetUrl: string;
};

export function AgentCertificateDocument({ data, qrTargetUrl }: AgentCertificateDocumentProps) {
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrTargetUrl)}`;
  const infoCardClassName =
    "rounded-2xl border border-[#E5D4A5] bg-white/90 px-5 py-4 overflow-hidden print:rounded-xl print:px-4 print:py-3";

  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white print:w-[210mm] print:max-w-[210mm]">
      <div className="relative min-h-[297mm] overflow-hidden border-[10px] border-[#1B2340] bg-[#FCFBF7] p-[10mm] print:h-[297mm] print:min-h-0 print:border-[8px] print:p-[8mm]">
        <div className="pointer-events-none absolute inset-[8mm] border-2 border-[#C6A96A]/70" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(#c6a96a 0.7px, transparent 0.7px)", backgroundSize: "20px 20px" }}
        />

        <div className="relative z-10 grid min-h-[calc(297mm-20mm)] grid-rows-[auto_auto_1fr_auto] print:min-h-[calc(297mm-16mm)]">
          <div className="flex flex-col items-center pt-3 text-center print:pt-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B2340] shadow-lg print:h-12 print:w-12 print:rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="GGBA Global" className="h-8 w-auto brightness-0 invert print:h-6" />
            </div>
            <p className="mt-4 text-xl font-black uppercase tracking-[0.28em] text-[#1B2340] print:mt-3 print:text-lg">GGBA Global</p>
            <div className="mt-4 h-px w-28 bg-[#C6A96A] print:mt-3 print:w-24" />
            <h1 className="mt-6 text-4xl font-serif leading-tight text-[#C6A96A] sm:text-5xl print:mt-4 print:text-[42px]">Certificate of Agency</h1>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 print:mt-2 print:text-[10px]">
              Official Partnership Recognition
            </p>
          </div>

          <div className="mt-10 flex flex-col print:mt-7">
            <p className="text-center font-serif text-lg italic text-slate-500 print:text-base">This is to proudly certify that</p>

            <div className="mx-auto mt-5 max-w-[150mm] border-b border-slate-300 pb-3 text-center print:mt-4 print:max-w-[140mm] print:pb-2">
              <h2 className="text-3xl font-bold uppercase tracking-[0.08em] text-[#1B2340] sm:text-4xl print:text-[28px]">{data.companyName}</h2>
            </div>

            <div className="mx-auto mt-7 max-w-[160mm] text-center print:mt-5 print:max-w-[150mm]">
              <p className="text-lg leading-8 text-slate-700 print:text-base print:leading-7">
                Represented by <span className="font-bold text-[#1B2340]">{data.representativeName}</span>, has been officially
                approved and registered with GGBA Global.
              </p>
            </div>
          </div>

          <div className="mt-8 grid h-[106mm] gap-5 md:grid-cols-[1.08fr_0.92fr] print:mt-6 print:h-[110mm] print:grid-cols-[1.08fr_0.92fr] print:gap-4">
            <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4 print:gap-3">
                <div className="grid grid-cols-2 gap-4 print:gap-3">
                  <div className={infoCardClassName}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 print:text-[10px]">Registration No.</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800 print:mt-1.5 print:text-[12px]">{data.registrationNumber}</p>
                  </div>
                  <div className={infoCardClassName}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 print:text-[10px]">Agent ID</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800 print:mt-1.5 print:text-[12px]">{data.agentId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 print:gap-3">
                  <div className={infoCardClassName}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 print:text-[10px]">Date of Issue</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800 print:mt-1.5 print:text-[12px]">{data.issuedAt}</p>
                  </div>
                  <div className={infoCardClassName}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 print:text-[10px]">Certificate ID</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800 print:mt-1.5 print:text-[12px]">{data.certificateId}</p>
                  </div>
                </div>

                <div className={`${infoCardClassName} h-full`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 print:text-[10px]">Verification Note</p>
                  <p className="mt-2 max-w-[95%] text-sm leading-6 text-slate-700 print:mt-1.5 print:text-[12px] print:leading-5">
                    This certificate is digitally verifiable via the QR code and does not require any physical signature.
                  </p>
                </div>
            </div>

            <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-[#E5D4A5] bg-white/95 px-6 py-6 text-center shadow-sm overflow-hidden print:rounded-[24px] print:px-4 print:py-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1B2340] print:text-[11px]">Scan to Verify</p>
              <div className="mt-4 rounded-[28px] border-4 border-[#1B2340] bg-white p-4 shadow-lg print:mt-3 print:rounded-[22px] print:p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl} alt="Certificate QR code" className="h-36 w-36 object-contain print:h-32 print:w-32" />
              </div>
              <p className="mt-4 max-w-[210px] text-xs leading-5 text-slate-500 print:mt-3 print:max-w-[200px] print:text-[11px] print:leading-5">
                Scanning this QR opens the official GGBA certificate page where the certificate can be downloaded.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 text-center print:mt-4 print:pt-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 print:text-[9px]">{data.certificateId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
