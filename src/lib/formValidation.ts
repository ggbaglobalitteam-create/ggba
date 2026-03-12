import { FieldConfig, StepConfig } from "@/types/visa";

export type StepValidationErrors = Record<string, string>;

export function validateStepData(
  step: StepConfig,
  formData: Record<string, unknown>
): StepValidationErrors {
  const errors: StepValidationErrors = {};
  for (const field of step.fields) {
    if (field.type === "section-header") continue;

    const value = formData[field.name];
    const required = isFieldRequired(field, formData);
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);

    if (required) {
      if (field.type === "checkbox" && value !== true) {
        errors[field.name] = `${field.label} is required`;
        continue;
      }
      if (field.type !== "checkbox" && empty) {
        errors[field.name] = `${field.label} is required`;
        continue;
      }
    }

    if (!required && empty) continue;
    const err = runFieldValidation(field, value);
    if (err) errors[field.name] = err;
  }
  return errors;
}

export function getFirstValidationError(errors: StepValidationErrors) {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : null;
}

type RequiredWhenRule = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: unknown[];
};

function isFieldRequired(field: FieldConfig, formData: Record<string, unknown>) {
  if (field.required) return true;
  const candidate = field.validation?.requiredWhen;
  const rule =
    candidate && typeof candidate === "object"
      ? (candidate as RequiredWhenRule)
      : null;
  if (!rule || typeof rule !== "object" || !rule.field) return false;
  const current = formData[rule.field];
  if (rule.equals !== undefined) return current === rule.equals;
  if (rule.notEquals !== undefined) return current !== rule.notEquals;
  if (Array.isArray(rule.in)) return rule.in.includes(current);
  return false;
}

function runFieldValidation(field: FieldConfig, value: unknown): string | null {
  const validation = (field.validation || {}) as Record<string, unknown>;

  if (field.type === "email" || validation.format === "email") {
    if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${field.label} must be a valid email`;
    }
  }

  if (field.type === "number") {
    const n = Number(value);
    if (Number.isNaN(n)) return `${field.label} must be a valid number`;
    if (validation.min !== undefined && n < Number(validation.min)) {
      return `${field.label} must be at least ${validation.min as string | number}`;
    }
    if (validation.max !== undefined && n > Number(validation.max)) {
      return `${field.label} must be at most ${validation.max as string | number}`;
    }
  }

  if (typeof value === "string") {
    if (validation.minLength !== undefined && value.length < Number(validation.minLength)) {
      return `${field.label} must be at least ${validation.minLength as string | number} characters`;
    }
    if (validation.maxLength !== undefined && value.length > Number(validation.maxLength)) {
      return `${field.label} must be at most ${validation.maxLength as string | number} characters`;
    }
    if (validation.pattern) {
      try {
        const re = new RegExp(String(validation.pattern));
        if (!re.test(value)) return validation.message || `${field.label} has invalid format`;
      } catch {
        // Ignore invalid regex patterns in config to avoid hard-failing form usage.
      }
    }
  }

  if (
    (field.type === "select" || field.type === "radio") &&
    Array.isArray(field.options) &&
    field.options.length > 0
  ) {
    if (!field.options.includes(String(value))) {
      return `${field.label} has an invalid selection`;
    }
  }

  return null;
}
