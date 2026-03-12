import { z } from "zod";

import { ApplicationFlowConfig, VisaConfig } from "@/types/visa";

export const flowDefaults: ApplicationFlowConfig = {
  requiresDocuments: true,
  requiresPayment: true,
  requiresAppointment: false,
  requirePaymentBeforeAppointment: true,
};

const fieldConfigSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "text",
    "select",
    "date",
    "textarea",
    "number",
    "file",
    "radio",
    "checkbox",
    "email",
    "section-header",
  ]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  className: z.string().optional(),
  wrapperClassName: z.string().optional(),
  validation: z.record(z.string(), z.unknown()).optional(),
});

const stepConfigSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  fields: z.array(fieldConfigSchema),
});

const documentItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  infoLabel: z.string().optional(),
  required: z.boolean(),
  notes: z.string().optional(),
  apostilleRequired: z.boolean().optional(),
  notarizationRequired: z.boolean().optional(),
});

const flowConfigSchema = z
  .object({
    requiresDocuments: z.boolean().optional(),
    requiresPayment: z.boolean().optional(),
    requiresAppointment: z.boolean().optional(),
    requirePaymentBeforeAppointment: z.boolean().optional(),
  })
  .optional();

const appointmentSlotSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  title: z.string().optional(),
});

const appointmentConfigSchema = z
  .object({
    instructions: z.string().optional(),
    slots: z.array(appointmentSlotSchema).default([]),
  })
  .optional();

const expectedFirstSectionHeaderByStepId: Record<string, string> = {
  "personal-profile": "section_visa_details",
  "contact-family": "section_contact_details",
  "professional-financial": "section_employment",
  "trip-accommodation": "section_travel_info",
  "background-history": "section_travel_history",
  declaration: "section_declaration",
};

function sanitizeStepFields(step: VisaConfig["steps"][number]) {
  let fields = [...step.fields];
  const expectedHeaderName = expectedFirstSectionHeaderByStepId[step.id];

  if (expectedHeaderName) {
    const expectedIndex = fields.findIndex(
      (field) =>
        field.type === "section-header" && field.name === expectedHeaderName
    );
    if (expectedIndex > 0) {
      // Guard against published configs where previous-step fields were prepended.
      fields = fields.slice(expectedIndex);
    }
  }

  const firstHeaderIndex = fields.findIndex(
    (field) => field.type === "section-header"
  );
  if (firstHeaderIndex > 0) {
    // If a step has any section headers, ignore dangling fields before the first header.
    fields = fields.slice(firstHeaderIndex);
  }

  // Keep only the last occurrence for duplicate field names.
  const lastIndexByFieldName = new Map<string, number>();
  fields.forEach((field, index) => {
    if (field.type !== "section-header") {
      lastIndexByFieldName.set(field.name, index);
    }
  });
  fields = fields.filter(
    (field, index) =>
      field.type === "section-header" ||
      lastIndexByFieldName.get(field.name) === index
  );

  return { ...step, fields };
}

export const visaConfigSchema = z.object({
  steps: z.array(stepConfigSchema).min(1),
  documentsRequired: z.array(documentItemSchema).default([]),
  processingTime: z.string().default(""),
  fee: z.string().default(""),
  notes: z.array(z.string()).default([]),
  embassyWarnings: z.array(z.string()).optional(),
  flow: flowConfigSchema,
  appointment: appointmentConfigSchema,
});

export function normalizeVisaConfig(input: unknown): VisaConfig {
  const parsed = visaConfigSchema.parse(input);
  const normalizedSteps = parsed.steps.map((step) => sanitizeStepFields(step));
  return {
    ...parsed,
    steps: normalizedSteps,
    flow: {
      ...flowDefaults,
      ...(parsed.flow || {}),
      // If no documents are configured, do not force the document stage.
      requiresDocuments:
        parsed.flow?.requiresDocuments ?? (parsed.documentsRequired.length > 0),
    },
    appointment: parsed.appointment
      ? {
          instructions: parsed.appointment.instructions,
          slots: parsed.appointment.slots || [],
        }
      : undefined,
  };
}

export function tryNormalizeVisaConfig(input: unknown): VisaConfig | null {
  try {
    return normalizeVisaConfig(input);
  } catch {
    return null;
  }
}

export function parseVisaKey(key: string) {
  const [countrySlug, ...purposeParts] = key.split("-");
  const purposeSlug = purposeParts.join("-");
  const country = toTitle(countrySlug);
  const purpose = toTitle(
    purposeSlug.replace(/-\/-/g, " / ").replace(/-/g, " ")
  );
  return { country, purpose };
}

function toTitle(v: string) {
  return v
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
