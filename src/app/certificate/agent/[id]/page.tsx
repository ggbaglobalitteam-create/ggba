import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PublicCertificateActions } from "@/components/portal/PublicCertificateActions";
import { AgentCertificateDocument } from "@/components/portal/AgentCertificateDocument";
import { buildAgentCertificateData } from "@/lib/agentCertificate";
import { prisma } from "@/lib/prisma";

function getBaseUrl() {
  const headerStore = headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${proto}://${host}`;
}

export default async function PublicAgentCertificatePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { download?: string };
}) {
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  if (!agent || agent.status !== "APPROVED") notFound();

  const data = buildAgentCertificateData({
    agentId: agent.id,
    companyName: agent.companyName,
    firstName: agent.user.firstName,
    lastName: agent.user.lastName,
    businessRegistrationNo: agent.businessRegistrationNo,
    createdAt: agent.createdAt,
  });

  const baseUrl = getBaseUrl();
  const downloadUrl = `${baseUrl}/certificate/agent/${encodeURIComponent(agent.id)}?download=1`;

  return (
    <main className="certificate-print-shell min-h-screen bg-[#f5f6fa] px-4 py-8 print:min-h-0 print:bg-white print:p-0">
      <PublicCertificateActions autoPrint={searchParams?.download === "1"} />
      <div className="certificate-print-stage print:m-0 print:p-0">
        <AgentCertificateDocument data={data} qrTargetUrl={downloadUrl} />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }

              html, body {
                width: 210mm;
                height: 297mm;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              body * {
                box-sizing: border-box !important;
              }

              .certificate-print-shell {
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }

              .certificate-print-stage {
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}
