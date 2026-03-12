"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard } from "lucide-react";

import { Card } from "@/components/portal/Card";
import { Button } from "@/components/portal/Button";
import { applicationService } from "@/lib/services/applicationService";
import { visaConfigService } from "@/lib/services/visaConfigService";
import { getPostPaymentRoute, resolveFlow, toAgentRoute } from "@/lib/applicationFlow";

type PaymentMethod = "card" | "bank";
type ServiceId = "application-handling" | "application-fee" | "professional-services" | "consultancy-package" | "other";

type ServiceOption = {
  id: ServiceId;
  label: string;
  amount: number;
  disclaimer?: string;
};

type AgentApplicationItem = {
  id: string;
  destinationCountry?: string | null;
  purpose?: string | null;
  createdAt?: string;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: "application-handling", label: "Application handling fee *", amount: 45, disclaimer: "Non-refundable" },
  { id: "application-fee", label: "Application fee *", amount: 250, disclaimer: "Non-refundable" },
  { id: "professional-services", label: "Professional Services fee *", amount: 500, disclaimer: "Non-refundable" },
  { id: "consultancy-package", label: "Consultancy package **", amount: 1000, disclaimer: "Refer to package terms and conditions" },
  { id: "other", label: "Others (please specify)", amount: 0 },
];

const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function AgentPaymentPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [feeNote, setFeeNote] = useState("");
  const [applications, setApplications] = useState<AgentApplicationItem[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<ServiceId[]>([]);
  const [otherServiceLabel, setOtherServiceLabel] = useState("");
  const [otherServiceAmount, setOtherServiceAmount] = useState("");

  useEffect(() => {
    async function init() {
      const requestedId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("applicationId")
          : null;
      const list = (await applicationService.listApplications().catch(() => [])) as AgentApplicationItem[];
      setApplications(list);
      const fallbackId = applicationService.getCurrentApplicationId();
      const selected =
        (requestedId && list.some((item) => item.id === requestedId) ? requestedId : null) ||
        (fallbackId && list.some((item) => item.id === fallbackId) ? fallbackId : null) ||
        list[0]?.id ||
        null;
      setSelectedApplicationId(selected);
      if (selected) applicationService.setCurrentApplicationId(selected);
      setIsLoading(false);
    }
    void init();
  }, []);

  useEffect(() => {
    async function loadConfig() {
      if (!selectedApplicationId) return;
      const config = await visaConfigService.getById(selectedApplicationId);
      if (!config) {
        router.push("/portal/agent/applicants");
        return;
      }
      const flow = resolveFlow(config);
      setFeeNote(config.fee || "");
      if (!flow.requiresPayment) {
        router.push(toAgentRoute(getPostPaymentRoute(config), selectedApplicationId));
      }
    }
    void loadConfig();
  }, [router, selectedApplicationId]);

  const toggleService = (serviceId: ServiceId) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((item) => item !== serviceId) : [...prev, serviceId]
    );
  };

  const normalizedOtherAmount = useMemo(() => {
    const parsed = Number.parseFloat(otherServiceAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100) / 100;
  }, [otherServiceAmount]);

  const selectedItems = useMemo(
    () => SERVICE_OPTIONS.filter((service) => selectedServiceIds.includes(service.id)),
    [selectedServiceIds]
  );

  const totalAmount = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        if (item.id === "other") return sum + normalizedOtherAmount;
        return sum + item.amount;
      }, 0),
    [selectedItems, normalizedOtherAmount]
  );

  const isOtherSelected = selectedServiceIds.includes("other");
  const hasValidOther = !isOtherSelected || (otherServiceLabel.trim().length > 0 && normalizedOtherAmount > 0);
  const canSubmitPayment = Boolean(method) && totalAmount > 0 && selectedServiceIds.length > 0 && hasValidOther;

  const displaySelectedItems = useMemo(
    () =>
      selectedItems.map((item) => {
        if (item.id !== "other") return { id: item.id, label: item.label, amount: item.amount };
        return { id: item.id, label: otherServiceLabel.trim() || "Other service", amount: normalizedOtherAmount };
      }),
    [selectedItems, otherServiceLabel, normalizedOtherAmount]
  );

  const handlePayNow = async () => {
    if (!method || !canSubmitPayment || !selectedApplicationId) return;
    setIsSubmitting(true);
    try {
      const config = await visaConfigService.getById(selectedApplicationId);
      if (!config) {
        router.push("/portal/agent/applicants");
        return;
      }

      const methodLabel = method === "card" ? "Credit / Debit Card" : "Bank Transfer";
      await fetch("/api/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApplicationId,
          amount: totalAmount,
          currency: "EUR",
          method: methodLabel,
          services: displaySelectedItems,
        }),
      });

      router.push(toAgentRoute(getPostPaymentRoute(config), selectedApplicationId));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Client Payment</h1>
        <p className="text-gray-500">Collect payment for selected applicant application.</p>
        {applications.length > 1 && (
          <div className="mt-4 max-w-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Application</label>
            <select
              value={selectedApplicationId || ""}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedApplicationId(next);
                applicationService.setCurrentApplicationId(next);
              }}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.destinationCountry || "-"} - {app.purpose || "-"} ({app.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 border-b border-blue-100/50">
              <h2 className="text-lg font-semibold text-gray-900">Service Selection</h2>
              <p className="text-sm text-gray-500 mt-1">You can choose multiple services.</p>
            </div>
            <div className="p-6 space-y-3">
              {SERVICE_OPTIONS.map((service) => {
                const checked = selectedServiceIds.includes(service.id);
                const isOther = service.id === "other";
                return (
                  <label
                    key={service.id}
                    className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer ${checked ? "border-[#C6A96A] bg-[#FDF9EF]" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(service.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#C6A96A] focus:ring-[#C6A96A]"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{service.label}</p>
                        {service.disclaimer && <p className="text-xs text-gray-500 mt-0.5">{service.disclaimer}</p>}
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 whitespace-nowrap">{isOther ? "Custom" : euro.format(service.amount)}</p>
                  </label>
                );
              })}

              {isOtherSelected && (
                <div className="rounded-xl border border-[#C6A96A]/40 bg-[#FDF9EF] p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wide font-semibold text-gray-500">Service Name</label>
                    <input
                      type="text"
                      placeholder="Enter custom service"
                      value={otherServiceLabel}
                      onChange={(event) => setOtherServiceLabel(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C6A96A]/40 focus:border-[#C6A96A]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide font-semibold text-gray-500">Amount (EUR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={otherServiceAmount}
                      onChange={(event) => setOtherServiceAmount(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C6A96A]/40 focus:border-[#C6A96A]"
                    />
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-1">
                <p>* Non-refundable.</p>
                <p>** Please refer to package terms and conditions.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-0 overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 border-b border-blue-100/50">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Order Summary</h2>
              <p className="text-sm text-gray-500">Based on selected services</p>
            </div>

            <div className="p-6 space-y-4">
              {displaySelectedItems.length === 0 && <p className="text-sm text-gray-500">No service selected yet.</p>}
              {displaySelectedItems.map((service) => (
                <div key={service.id + service.label} className="flex justify-between text-sm gap-3">
                  <span className="text-gray-700 font-medium">{service.label}</span>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">{euro.format(service.amount)}</span>
                </div>
              ))}

              {feeNote && (
                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="font-semibold text-gray-600">Remarks:</span> {feeNote}
                </div>
              )}

              <div className="pt-4 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-900 uppercase tracking-widest text-sm">Total Amount</span>
                <span className="text-2xl font-bold text-[#C6A96A]">{euro.format(totalAmount)}</span>
              </div>
            </div>
          </Card>

          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Select Payment Method</h2>
          <div className="grid gap-4">
            <label className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${method === "card" ? "border-[#C6A96A] bg-blue-50/10 shadow-[0_0_0_4px_rgba(24,144,255,0.05)] scale-[1.02]" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"}`}>
              <input type="radio" name="payment" onChange={() => setMethod("card")} checked={method === "card"} className="mt-2 mr-4 ml-1 w-4 h-4 border-gray-300 text-[#C6A96A] focus:ring-[#C6A96A]" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-semibold text-gray-900">Credit / Debit Card</span>
                  <span className="block text-xs text-gray-500 mt-1 font-medium">Visa, Mastercard, Amex supported</span>
                </div>
              </div>
            </label>
            <label className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${method === "bank" ? "border-[#C6A96A] bg-blue-50/10 shadow-[0_0_0_4px_rgba(24,144,255,0.05)] scale-[1.02]" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"}`}>
              <input type="radio" name="payment" onChange={() => setMethod("bank")} checked={method === "bank"} className="mt-2 mr-4 ml-1 w-4 h-4 border-gray-300 text-[#C6A96A] focus:ring-[#C6A96A]" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-semibold text-gray-900">Bank Transfer</span>
                  <span className="block text-xs text-gray-500 mt-1 font-medium">Direct deposit / Wire instructions</span>
                </div>
              </div>
            </label>
          </div>

          <Button fullWidth size="lg" disabled={!canSubmitPayment || isSubmitting} isLoading={isSubmitting} onClick={handlePayNow} className="py-4 text-base shadow-lg shadow-blue-500/20">
            Pay Now - {euro.format(totalAmount)}
          </Button>
        </div>
      </div>
    </div>
  );
}
