import { formatAgentRef } from "@/lib/displayId";

export type AgentCertificateData = {
  agentId: string;
  companyName: string;
  representativeName: string;
  registrationNumber: string;
  issuedAt: string;
  certificateId: string;
};

export function buildAgentCertificateData(params: {
  agentId: string;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  businessRegistrationNo?: string | null;
  createdAt: string | Date;
}): AgentCertificateData {
  const createdAt = new Date(params.createdAt);
  const agentRef = formatAgentRef(params.agentId);
  const certificateId = `GGBA-${createdAt.getFullYear()}-${agentRef.replace("AGT-", "")}`;

  return {
    agentId: agentRef,
    companyName: params.companyName?.trim() || "Approved Agent",
    representativeName: `${params.firstName || ""} ${params.lastName || ""}`.trim() || "Authorized Representative",
    registrationNumber: params.businessRegistrationNo?.trim() || "N/A",
    issuedAt: createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    certificateId,
  };
}
