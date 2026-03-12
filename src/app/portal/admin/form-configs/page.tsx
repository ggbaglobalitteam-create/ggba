"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/portal/Button";
import { Card } from "@/components/portal/Card";
import { DocumentItem, FieldConfig, StepConfig, VisaConfig } from "@/types/visa";

type CatalogItem = {
  configKey: string;
  country: string;
  purpose: string;
  source: "DEFAULT" | "OVERRIDE";
  status: "DRAFT" | "PUBLISHED";
};

type ConfigResponse = {
  configKey: string;
  config: VisaConfig;
  status: "DRAFT" | "PUBLISHED";
  source?: "DEFAULT" | "OVERRIDE";
  country?: string;
  purpose?: string;
};

type SaveAction = "draft" | "publish" | "reset";

const flowFields: Array<{
  key: "requiresDocuments" | "requiresPayment" | "requiresAppointment" | "requirePaymentBeforeAppointment";
  label: string;
}> = [
  { key: "requiresDocuments", label: "Require Documents Stage" },
  { key: "requiresPayment", label: "Require Payment Stage" },
  { key: "requiresAppointment", label: "Require Appointment Stage" },
  { key: "requirePaymentBeforeAppointment", label: "Payment Before Appointment" },
];

const editableFieldTypes: Array<FieldConfig["type"]> = [
  "text",
  "email",
  "number",
  "date",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "section-header",
];

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function toSlug(value: string, fallback: string) {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function parseOptions(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatOptions(options?: string[]) {
  return Array.isArray(options) ? options.join(", ") : "";
}

function createField(step: StepConfig): FieldConfig {
  let index = step.fields.length + 1;
  let candidate = `${toSlug(step.id, "step")}_field_${index}`;
  while (step.fields.some((field) => field.name === candidate)) {
    index += 1;
    candidate = `${toSlug(step.id, "step")}_field_${index}`;
  }

  return {
    name: candidate,
    label: `New Field ${index}`,
    type: "text",
    required: false,
    placeholder: "",
    helpText: "",
    validation: {},
  };
}

function createStep(existingSteps: StepConfig[]): StepConfig {
  let index = existingSteps.length + 1;
  let candidate = `custom-step-${index}`;
  while (existingSteps.some((step) => step.id === candidate)) {
    index += 1;
    candidate = `custom-step-${index}`;
  }

  return {
    id: candidate,
    title: `Custom Step ${index}`,
    fields: [],
  };
}

function createDocument(existingDocs: DocumentItem[]): DocumentItem {
  let index = existingDocs.length + 1;
  let candidate = `document-${index}`;
  while (existingDocs.some((doc) => doc.id === candidate)) {
    index += 1;
    candidate = `document-${index}`;
  }

  return {
    id: candidate,
    name: `New Document ${index}`,
    required: false,
    infoLabel: "",
    notes: "",
    apostilleRequired: false,
    notarizationRequired: false,
  };
}

function createAppointmentSlot(slotCount: number) {
  const index = slotCount + 1;
  const date = new Date();
  date.setDate(date.getDate() + index);
  return {
    id: `slot-${index}`,
    date: date.toISOString().slice(0, 10),
    time: "10:00",
    title: `Slot ${index}`,
  };
}

function getFlowRoutePreview(config: VisaConfig): string[] {
  const flow = config.flow;
  const requiresDocuments = flow?.requiresDocuments ?? config.documentsRequired.length > 0;
  const requiresPayment = Boolean(flow?.requiresPayment);
  const requiresAppointment = Boolean(flow?.requiresAppointment);
  const paymentBeforeAppointment = Boolean(flow?.requirePaymentBeforeAppointment);

  const route = ["Application Form"];

  if (requiresDocuments) route.push("Upload Documents");
  if (requiresPayment && paymentBeforeAppointment) route.push("Payment");
  if (requiresAppointment) route.push("Appointment Booking");
  if (requiresPayment && !paymentBeforeAppointment) route.push("Payment");
  route.push("Status");

  return route;
}

function toCatalog(body: unknown): CatalogItem[] {
  const raw = body && typeof body === "object" ? (body as { catalog?: unknown }).catalog : undefined;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      configKey: String(item.configKey || ""),
      country: String(item.country || ""),
      purpose: String(item.purpose || ""),
      source: item.source === "OVERRIDE" ? ("OVERRIDE" as const) : ("DEFAULT" as const),
      status: item.status === "DRAFT" ? ("DRAFT" as const) : ("PUBLISHED" as const),
    }))
    .filter((item) => item.configKey && item.country && item.purpose);
}

export default function AdminFormConfigsPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [configObj, setConfigObj] = useState<VisaConfig | null>(null);
  const [rawJson, setRawJson] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [source, setSource] = useState<"DEFAULT" | "OVERRIDE">("DEFAULT");
  const [isLoading, setIsLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<SaveAction | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isDeletingConfig, setIsDeletingConfig] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [newConfigKey, setNewConfigKey] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/visa-configs", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load config catalog");
        const body = await res.json();
        const items = toCatalog(body);
        if (!active) return;

        setCatalog(items);
        setSelectedKey((prev) => prev || items[0]?.configKey || "");
      } catch (err: unknown) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load config catalog"));
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    let active = true;
    async function loadOne() {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        const res = await fetch(`/api/visa-configs/${encodeURIComponent(selectedKey)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load selected config");
        const body: ConfigResponse = await res.json();
        if (!active) return;

        setConfigObj(body.config);
        setRawJson(JSON.stringify(body.config, null, 2));
        setStatus(body.status || "DRAFT");
        setSource(body.source || "DEFAULT");
        setEditCountry(body.country || "");
        setEditPurpose(body.purpose || "");
      } catch (err: unknown) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load selected config"));
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadOne();
    return () => {
      active = false;
    };
  }, [selectedKey]);

  const selectedMeta = useMemo(
    () => catalog.find((item) => item.configKey === selectedKey) || null,
    [catalog, selectedKey]
  );

  const countryOptions = useMemo(() => {
    const values = new Set(catalog.map((item) => item.country).filter(Boolean));
    if (editCountry.trim()) values.add(editCountry.trim());
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [catalog, editCountry]);

  const purposeOptions = useMemo(() => {
    const fromCountry = catalog
      .filter((item) => item.country === editCountry)
      .map((item) => item.purpose)
      .filter(Boolean);
    const values = new Set(fromCountry);
    if (editPurpose.trim()) values.add(editPurpose.trim());
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [catalog, editCountry, editPurpose]);

  const flowPreview = useMemo(() => {
    if (!configObj) return [] as string[];
    return getFlowRoutePreview(configObj);
  }, [configObj]);

  function updateConfig(updater: (current: VisaConfig) => VisaConfig) {
    setConfigObj((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      setRawJson(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function updateStep(stepIndex: number, updater: (step: StepConfig) => StepConfig) {
    updateConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((step, idx) => (idx === stepIndex ? updater(step) : step)),
    }));
  }

  function updateField(
    stepIndex: number,
    fieldIndex: number,
    updater: (field: FieldConfig) => FieldConfig
  ) {
    updateStep(stepIndex, (step) => ({
      ...step,
      fields: step.fields.map((field, idx) => (idx === fieldIndex ? updater(field) : field)),
    }));
  }

  async function save(targetStatus: "DRAFT" | "PUBLISHED") {
    if (!selectedKey || savingAction || isCreating || isSavingMeta || isDeletingConfig) return;
    setSavingAction(targetStatus === "PUBLISHED" ? "publish" : "draft");
    setError(null);
    setMessage(null);
    try {
      const parsed = JSON.parse(rawJson);
      const res = await fetch(`/api/visa-configs/${encodeURIComponent(selectedKey)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config: parsed, status: targetStatus }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to save config");

      setStatus(targetStatus);
      setSource("OVERRIDE");
      setMessage(targetStatus === "PUBLISHED" ? "Config published." : "Draft saved.");
      setConfigObj(body.config || parsed);
      setRawJson(JSON.stringify(body.config || parsed, null, 2));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save config"));
    } finally {
      setSavingAction(null);
    }
  }

  async function deleteOverride() {
    if (!selectedKey || savingAction || isCreating || isSavingMeta || isDeletingConfig) return;
    setSavingAction("reset");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/visa-configs/${encodeURIComponent(selectedKey)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete override");
      setMessage("Override deleted. Reverted to default config.");

      const refresh = await fetch(`/api/visa-configs/${encodeURIComponent(selectedKey)}`, {
        cache: "no-store",
      });
      if (refresh.ok) {
        const body: ConfigResponse = await refresh.json();
        setConfigObj(body.config);
        setRawJson(JSON.stringify(body.config, null, 2));
        setStatus(body.status);
        setSource(body.source || "DEFAULT");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete override"));
    } finally {
      setSavingAction(null);
    }
  }

  function applyRawJson() {
    try {
      const parsed = JSON.parse(rawJson);
      setConfigObj(parsed);
      setError(null);
      setMessage("JSON applied locally. Save or Publish to persist.");
    } catch {
      setError("JSON is invalid. Fix syntax before applying.");
    }
  }

  async function createNewConfig() {
    if (isCreating || savingAction || isSavingMeta || isDeletingConfig) return;

    const baseConfig = configObj;
    if (!baseConfig) {
      setError("Load an existing config first, then create a new one.");
      return;
    }

    const customKey = toSlug(newConfigKey, "");
    const countryKey = toSlug(newCountry, "");
    const purposeKey = toSlug(newPurpose, "");
    const derivedKey = customKey || (countryKey && purposeKey ? `${countryKey}-${purposeKey}` : "");

    if (!derivedKey) {
      setError("Enter Country and Purpose, or provide a Config Key.");
      return;
    }

    if (catalog.some((item) => item.configKey === derivedKey)) {
      setError("This config key already exists. Choose another key.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setMessage(null);
    try {
      const payloadConfig = JSON.parse(JSON.stringify(baseConfig)) as VisaConfig;
      const createRes = await fetch("/api/visa-configs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          configKey: derivedKey,
          country: newCountry.trim() || undefined,
          purpose: newPurpose.trim() || undefined,
          config: payloadConfig,
          status: "DRAFT",
        }),
      });
      const createdBody = await createRes.json().catch(() => null);
      if (!createRes.ok) throw new Error(createdBody?.error || "Failed to create new config");

      const catalogRes = await fetch("/api/visa-configs", { cache: "no-store" });
      if (!catalogRes.ok) throw new Error("Config created but failed to refresh catalog");
      const catalogBody = await catalogRes.json();
      const nextCatalog = toCatalog(catalogBody);
      setCatalog(nextCatalog);
      setSelectedKey(derivedKey);
      setStatus("DRAFT");
      setSource("OVERRIDE");
      setNewCountry("");
      setNewPurpose("");
      setNewConfigKey("");
      setMessage(`Created new draft config: ${derivedKey}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create new config"));
    } finally {
      setIsCreating(false);
    }
  }

  async function saveCountryPurpose() {
    if (!selectedKey || savingAction || isCreating || isSavingMeta || isDeletingConfig) return;

    const country = editCountry.trim();
    const purpose = editPurpose.trim();
    if (!country || !purpose) {
      setError("Country and Purpose are required.");
      return;
    }

    setIsSavingMeta(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/visa-configs/${encodeURIComponent(selectedKey)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ country, purpose }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to save country and purpose");

      setEditCountry(body?.country || country);
      setEditPurpose(body?.purpose || purpose);
      if (body?.status) setStatus(body.status);
      if (body?.source) setSource(body.source);
      setMessage("Country and purpose updated.");

      const refreshCatalog = await fetch("/api/visa-configs", { cache: "no-store" });
      if (refreshCatalog.ok) {
        const refreshBody = await refreshCatalog.json();
        setCatalog(toCatalog(refreshBody));
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save country and purpose"));
    } finally {
      setIsSavingMeta(false);
    }
  }

  async function deleteSelectedConfig() {
    if (!selectedKey || savingAction || isCreating || isSavingMeta || isDeletingConfig) return;

    const label = selectedMeta
      ? `${selectedMeta.country} / ${selectedMeta.purpose}`
      : selectedKey;
    const confirmed = window.confirm(
      `Delete "${label}" from the dropdown catalog? This will hide it for applicants and agents.`
    );
    if (!confirmed) return;

    setIsDeletingConfig(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/visa-configs/${encodeURIComponent(selectedKey)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deleted: true }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to delete selected config");

      const catalogRes = await fetch("/api/visa-configs", { cache: "no-store" });
      if (!catalogRes.ok) throw new Error("Deleted config but failed to refresh catalog");
      const catalogBody = await catalogRes.json();
      const nextCatalog = toCatalog(catalogBody);
      setCatalog(nextCatalog);
      const nextKey = nextCatalog[0]?.configKey || "";
      setSelectedKey(nextKey);
      if (!nextKey) {
        setConfigObj(null);
        setRawJson("");
        setEditCountry("");
        setEditPurpose("");
      }
      setMessage("Selected country/category removed from dropdown catalog.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete selected config"));
    } finally {
      setIsDeletingConfig(false);
    }
  }

  if (isLoading && !configObj) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C2430]">Application Form Configs</h1>
          <p className="text-gray-500 mt-1">
            Manage fields, required and optional documents, validation, and end-to-end stage flow per visa type.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => save("DRAFT")}
            isLoading={savingAction === "draft"}
            disabled={Boolean(savingAction) || isCreating || isSavingMeta || isDeletingConfig}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => save("PUBLISHED")}
            isLoading={savingAction === "publish"}
            disabled={Boolean(savingAction) || isCreating || isSavingMeta || isDeletingConfig}
          >
            Publish
          </Button>
          <Button
            variant="outline"
            onClick={deleteOverride}
            isLoading={savingAction === "reset"}
            disabled={Boolean(savingAction) || isCreating || isSavingMeta || isDeletingConfig}
          >
            Reset Override
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">{message}</div>}

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Config Key</label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {catalog.map((item) => (
                <option key={item.configKey} value={item.configKey}>
                  {item.country} - {item.purpose} ({item.configKey})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500">Status</p>
              <p className="font-semibold text-gray-900">{status}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500">Source</p>
              <p className="font-semibold text-gray-900">{source}</p>
            </div>
          </div>
        </div>
        {selectedMeta && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Editing: <span className="font-semibold">{selectedMeta.country}</span> /{" "}
              <span className="font-semibold">{selectedMeta.purpose}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Country</label>
                <select
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Purpose</label>
                <select
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {purposeOptions.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={saveCountryPurpose}
                  isLoading={isSavingMeta}
                  disabled={Boolean(savingAction) || isCreating || isDeletingConfig}
                >
                  Save Country &amp; Purpose
                </Button>
                <Button
                  variant="outline"
                  onClick={deleteSelectedConfig}
                  isLoading={isDeletingConfig}
                  disabled={Boolean(savingAction) || isCreating || isSavingMeta}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Delete Country &amp; Category
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Create New Application Form</h2>
          <p className="text-sm text-gray-500 mt-1">
            Creates a new draft config using the currently loaded form as a starting template.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Country</label>
            <input
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              placeholder="e.g. Georgia"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Purpose</label>
            <input
              value={newPurpose}
              onChange={(e) => setNewPurpose(e.target.value)}
              placeholder="e.g. Work Visa"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Config Key (optional)
            </label>
            <input
              value={newConfigKey}
              onChange={(e) => setNewConfigKey(e.target.value)}
              placeholder="auto-generated if empty"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-gray-500">
            Preview key:{" "}
            <span className="font-mono text-gray-700">
              {newConfigKey.trim()
                ? toSlug(newConfigKey, "")
                : toSlug(newCountry, "") && toSlug(newPurpose, "")
                  ? `${toSlug(newCountry, "")}-${toSlug(newPurpose, "")}`
                  : "-"}
            </span>
          </p>
          <Button
            onClick={createNewConfig}
            isLoading={isCreating}
            disabled={Boolean(savingAction) || isSavingMeta || isDeletingConfig || !configObj}
          >
            Create Draft Config
          </Button>
        </div>
      </Card>

      {configObj && (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Flow Controls</h2>
              {flowPreview.length > 0 && (
                <p className="text-xs text-gray-500">
                  Route: <span className="font-medium text-gray-700">{flowPreview.join(" -> ")}</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {flowFields.map(({ key, label }) => {
                const requiresPayment = Boolean(configObj.flow?.requiresPayment);
                const requiresAppointment = Boolean(configObj.flow?.requiresAppointment);
                const disabled =
                  key === "requirePaymentBeforeAppointment" &&
                  (!requiresPayment || !requiresAppointment);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(configObj.flow?.[key])}
                      disabled={disabled}
                      onChange={(e) =>
                        updateConfig((prev) => {
                          const baseFlow = prev.flow || {
                            requiresDocuments: prev.documentsRequired.length > 0,
                            requiresPayment: false,
                            requiresAppointment: false,
                            requirePaymentBeforeAppointment: false,
                          };
                          const nextFlow = {
                            ...baseFlow,
                            [key]: e.target.checked,
                          };
                          if (!nextFlow.requiresAppointment || !nextFlow.requiresPayment) {
                            nextFlow.requirePaymentBeforeAppointment = false;
                          }
                          return {
                            ...prev,
                            flow: nextFlow,
                          };
                        })
                      }
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Form Steps and Fields</h2>
              <Button
                variant="outline"
                onClick={() =>
                  updateConfig((prev) => ({
                    ...prev,
                    steps: [...prev.steps, createStep(prev.steps)],
                  }))
                }
              >
                Add Step
              </Button>
            </div>

            <div className="space-y-5">
              {configObj.steps.map((step, stepIndex) => (
                <div key={`${step.id}-${stepIndex}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step Id</label>
                      <input
                        value={step.id}
                        onChange={(e) =>
                          updateStep(stepIndex, (prev) => ({
                            ...prev,
                            id: toSlug(e.target.value, `step-${stepIndex + 1}`),
                          }))
                        }
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step Title</label>
                      <input
                        value={step.title}
                        onChange={(e) =>
                          updateStep(stepIndex, (prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (stepIndex === 0) return;
                        updateConfig((prev) => {
                          const nextSteps = [...prev.steps];
                          const temp = nextSteps[stepIndex - 1];
                          nextSteps[stepIndex - 1] = nextSteps[stepIndex];
                          nextSteps[stepIndex] = temp;
                          return { ...prev, steps: nextSteps };
                        });
                      }}
                      disabled={stepIndex === 0}
                    >
                      Move Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (stepIndex >= configObj.steps.length - 1) return;
                        updateConfig((prev) => {
                          const nextSteps = [...prev.steps];
                          const temp = nextSteps[stepIndex + 1];
                          nextSteps[stepIndex + 1] = nextSteps[stepIndex];
                          nextSteps[stepIndex] = temp;
                          return { ...prev, steps: nextSteps };
                        });
                      }}
                      disabled={stepIndex >= configObj.steps.length - 1}
                    >
                      Move Down
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStep(stepIndex, (prev) => ({
                          ...prev,
                          fields: [...prev.fields, createField(prev)],
                        }))
                      }
                    >
                      Add Field
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (configObj.steps.length <= 1) {
                          setError("At least one step is required.");
                          return;
                        }
                        updateConfig((prev) => ({
                          ...prev,
                          steps: prev.steps.filter((_, idx) => idx !== stepIndex),
                        }));
                      }}
                    >
                      Remove Step
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {step.fields.map((field, fieldIndex) => (
                      <div key={`${field.name}-${fieldIndex}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                          <div className="md:col-span-3">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</label>
                            <input
                              value={field.name}
                              onChange={(e) =>
                                updateField(stepIndex, fieldIndex, (prev) => ({
                                  ...prev,
                                  name: toSlug(e.target.value, prev.name),
                                }))
                              }
                              className="w-full mt-1 border border-gray-200 rounded-lg px-2 py-2 text-sm"
                            />
                          </div>

                          <div className="md:col-span-4">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Label</label>
                            <input
                              value={field.label}
                              onChange={(e) =>
                                updateField(stepIndex, fieldIndex, (prev) => ({ ...prev, label: e.target.value }))
                              }
                              className="w-full mt-1 border border-gray-200 rounded-lg px-2 py-2 text-sm"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => {
                                const nextType = e.target.value as FieldConfig["type"];
                                updateField(stepIndex, fieldIndex, (prev) => ({
                                  ...prev,
                                  type: nextType,
                                  required: nextType === "section-header" ? false : prev.required,
                                  options:
                                    nextType === "select" || nextType === "radio"
                                      ? prev.options && prev.options.length > 0
                                        ? prev.options
                                        : ["Option 1", "Option 2"]
                                      : undefined,
                                }));
                              }}
                              className="w-full mt-1 border border-gray-200 rounded-lg px-2 py-2 text-sm"
                            >
                              {editableFieldTypes.map((fieldType) => (
                                <option key={fieldType} value={fieldType}>
                                  {fieldType}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-1 flex items-center justify-start md:justify-center pb-1">
                            <label className="text-xs text-gray-700 flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={field.required}
                                disabled={field.type === "section-header"}
                                onChange={(e) =>
                                  updateField(stepIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    required: e.target.checked,
                                  }))
                                }
                              />
                              Required
                            </label>
                          </div>

                          <div className="md:col-span-2 flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const current = JSON.stringify(field.validation || {}, null, 2);
                                const next = window.prompt("Edit field.validation JSON", current);
                                if (next === null) return;
                                try {
                                  const parsed = next.trim() ? JSON.parse(next) : {};
                                  updateField(stepIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    validation: parsed,
                                  }));
                                } catch {
                                  setError("Invalid validation JSON");
                                }
                              }}
                            >
                              Validation
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                updateStep(stepIndex, (prev) => ({
                                  ...prev,
                                  fields: prev.fields.filter((_, idx) => idx !== fieldIndex),
                                }))
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        {(field.type === "select" || field.type === "radio") && (
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Options (comma separated)
                            </label>
                            <input
                              value={formatOptions(field.options)}
                              onChange={(e) =>
                                updateField(stepIndex, fieldIndex, (prev) => ({
                                  ...prev,
                                  options: parseOptions(e.target.value),
                                }))
                              }
                              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        )}

                        {field.type !== "section-header" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Placeholder</label>
                              <input
                                value={field.placeholder || ""}
                                onChange={(e) =>
                                  updateField(stepIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    placeholder: e.target.value,
                                  }))
                                }
                                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Help Text</label>
                              <input
                                value={field.helpText || ""}
                                onChange={(e) =>
                                  updateField(stepIndex, fieldIndex, (prev) => ({
                                    ...prev,
                                    helpText: e.target.value,
                                  }))
                                }
                                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {step.fields.length === 0 && (
                      <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-3">
                        No fields in this step yet. Add fields to make this step visible to applicants.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Required Documents</h2>
              <Button
                variant="outline"
                onClick={() =>
                  updateConfig((prev) => ({
                    ...prev,
                    documentsRequired: [...prev.documentsRequired, createDocument(prev.documentsRequired)],
                  }))
                }
              >
                Add Document
              </Button>
            </div>

            <div className="space-y-3">
              {configObj.documentsRequired.map((doc, docIndex) => (
                <div key={`${doc.id}-${docIndex}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Doc Id</label>
                      <input
                        value={doc.id}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            documentsRequired: prev.documentsRequired.map((item, idx) =>
                              idx === docIndex ? { ...item, id: toSlug(e.target.value, item.id) } : item
                            ),
                          }))
                        }
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</label>
                      <input
                        value={doc.name}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            documentsRequired: prev.documentsRequired.map((item, idx) =>
                              idx === docIndex ? { ...item, name: e.target.value } : item
                            ),
                          }))
                        }
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Required</label>
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(doc.required)}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              documentsRequired: prev.documentsRequired.map((item, idx) =>
                                idx === docIndex ? { ...item, required: e.target.checked } : item
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            documentsRequired: prev.documentsRequired.filter((_, idx) => idx !== docIndex),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Info Label</label>
                      <input
                        value={doc.infoLabel || ""}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            documentsRequired: prev.documentsRequired.map((item, idx) =>
                              idx === docIndex ? { ...item, infoLabel: e.target.value } : item
                            ),
                          }))
                        }
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</label>
                      <input
                        value={doc.notes || ""}
                        onChange={(e) =>
                          updateConfig((prev) => ({
                            ...prev,
                            documentsRequired: prev.documentsRequired.map((item, idx) =>
                              idx === docIndex ? { ...item, notes: e.target.value } : item
                            ),
                          }))
                        }
                        className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-2 pt-5">
                      <label className="text-xs text-gray-700 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(doc.apostilleRequired)}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              documentsRequired: prev.documentsRequired.map((item, idx) =>
                                idx === docIndex
                                  ? { ...item, apostilleRequired: e.target.checked }
                                  : item
                              ),
                            }))
                          }
                        />
                        Apostille required
                      </label>
                      <label className="text-xs text-gray-700 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(doc.notarizationRequired)}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              documentsRequired: prev.documentsRequired.map((item, idx) =>
                                idx === docIndex
                                  ? { ...item, notarizationRequired: e.target.checked }
                                  : item
                              ),
                            }))
                          }
                        />
                        Notarization required
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {configObj.documentsRequired.length === 0 && (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-3">
                  No documents configured. Disable the Require Documents Stage toggle if this visa should skip uploads.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Appointment Booking</h2>
              <Button
                variant="outline"
                onClick={() =>
                  updateConfig((prev) => {
                    const currentSlots = prev.appointment?.slots || [];
                    return {
                      ...prev,
                      appointment: {
                        instructions: prev.appointment?.instructions || "",
                        slots: [...currentSlots, createAppointmentSlot(currentSlots.length)],
                      },
                    };
                  })
                }
                disabled={!configObj.flow?.requiresAppointment}
              >
                Add Slot
              </Button>
            </div>

            {!configObj.flow?.requiresAppointment ? (
              <div className="text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg p-3">
                Appointment flow is currently disabled for this visa type. Enable the Require Appointment Stage toggle in Flow Controls.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Booking Instructions</label>
                  <textarea
                    value={configObj.appointment?.instructions || ""}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        appointment: {
                          instructions: e.target.value,
                          slots: prev.appointment?.slots || [],
                        },
                      }))
                    }
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[96px]"
                    placeholder="Add instructions that appear on the booking page."
                  />
                </div>

                <div className="space-y-2">
                  {(configObj.appointment?.slots || []).map((slot, slotIndex) => (
                    <div key={`${slot.id}-${slotIndex}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-3">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Slot Id</label>
                          <input
                            value={slot.id}
                            onChange={(e) =>
                              updateConfig((prev) => ({
                                ...prev,
                                appointment: {
                                  instructions: prev.appointment?.instructions || "",
                                  slots: (prev.appointment?.slots || []).map((item, idx) =>
                                    idx === slotIndex ? { ...item, id: toSlug(e.target.value, item.id) } : item
                                  ),
                                },
                              }))
                            }
                            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</label>
                          <input
                            type="date"
                            value={slot.date}
                            onChange={(e) =>
                              updateConfig((prev) => ({
                                ...prev,
                                appointment: {
                                  instructions: prev.appointment?.instructions || "",
                                  slots: (prev.appointment?.slots || []).map((item, idx) =>
                                    idx === slotIndex ? { ...item, date: e.target.value } : item
                                  ),
                                },
                              }))
                            }
                            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Time</label>
                          <input
                            type="time"
                            value={slot.time}
                            onChange={(e) =>
                              updateConfig((prev) => ({
                                ...prev,
                                appointment: {
                                  instructions: prev.appointment?.instructions || "",
                                  slots: (prev.appointment?.slots || []).map((item, idx) =>
                                    idx === slotIndex ? { ...item, time: e.target.value } : item
                                  ),
                                },
                              }))
                            }
                            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</label>
                          <input
                            value={slot.title || ""}
                            onChange={(e) =>
                              updateConfig((prev) => ({
                                ...prev,
                                appointment: {
                                  instructions: prev.appointment?.instructions || "",
                                  slots: (prev.appointment?.slots || []).map((item, idx) =>
                                    idx === slotIndex ? { ...item, title: e.target.value } : item
                                  ),
                                },
                              }))
                            }
                            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              updateConfig((prev) => ({
                                ...prev,
                                appointment: {
                                  instructions: prev.appointment?.instructions || "",
                                  slots: (prev.appointment?.slots || []).filter((_, idx) => idx !== slotIndex),
                                },
                              }))
                            }
                          >
                            X
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(configObj.appointment?.slots || []).length === 0 && (
                    <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-3">
                      No appointment slots configured yet.
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Raw JSON</h2>
              <Button variant="outline" onClick={applyRawJson}>
                Apply JSON
              </Button>
            </div>
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="w-full min-h-[420px] rounded-lg border border-gray-300 bg-[#0f172a] text-gray-100 font-mono text-xs p-4"
              spellCheck={false}
            />
          </Card>
        </>
      )}
    </div>
  );
}
