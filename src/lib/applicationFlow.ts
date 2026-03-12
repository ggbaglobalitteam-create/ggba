import { ApplicationFlowConfig, VisaConfig } from "@/types/visa";
import { flowDefaults } from "@/lib/visaConfigSchema";

export function resolveFlow(config?: VisaConfig | null): ApplicationFlowConfig {
  const docsCount = config?.documentsRequired?.length ?? 0;
  const flow = config?.flow || {};
  return {
    ...flowDefaults,
    ...flow,
    requiresDocuments: flow.requiresDocuments ?? docsCount > 0,
  };
}

export function getRouteAfterForm(config?: VisaConfig | null) {
  const flow = resolveFlow(config);
  if (flow.requiresDocuments) return "/portal/applicant/upload-documents";
  return getPostDocumentsRoute(config);
}

export function getPostDocumentsRoute(config?: VisaConfig | null) {
  const flow = resolveFlow(config);

  if (flow.requiresPayment && flow.requirePaymentBeforeAppointment) {
    return "/portal/applicant/payment";
  }
  if (flow.requiresAppointment) {
    return "/portal/applicant/booking";
  }
  if (flow.requiresPayment) {
    return "/portal/applicant/payment";
  }
  return "/portal/applicant/status";
}

export function getPostPaymentRoute(config?: VisaConfig | null) {
  const flow = resolveFlow(config);
  if (flow.requiresAppointment && flow.requirePaymentBeforeAppointment) {
    return "/portal/applicant/booking";
  }
  return "/portal/applicant/status";
}

export function getPostAppointmentRoute(config?: VisaConfig | null) {
  const flow = resolveFlow(config);
  if (flow.requiresPayment && !flow.requirePaymentBeforeAppointment) {
    return "/portal/applicant/payment";
  }
  return "/portal/applicant/status";
}

export function toAgentRoute(route: string, applicationId?: string) {
  const appQuery = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : "";
  if (route === "/portal/applicant/payment") return `/portal/agent/payment${appQuery}`;
  if (route === "/portal/applicant/booking") return `/portal/agent/booking${appQuery}`;
  if (route === "/portal/applicant/upload-documents") {
    return applicationId ? `/portal/agent/upload-documents/${encodeURIComponent(applicationId)}` : "/portal/agent/upload-documents";
  }
  if (route === "/portal/applicant/status") {
    return applicationId ? `/portal/agent/applicants/${encodeURIComponent(applicationId)}` : "/portal/agent/applicants";
  }
  return "/portal/agent/applicants";
}
