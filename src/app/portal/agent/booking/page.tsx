"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/portal/Button";
import SimpleBookingCalendar from "@/components/booking/SimpleBookingCalendar";
import { visaConfigService } from "@/lib/services/visaConfigService";
import { applicationService } from "@/lib/services/applicationService";
import { getPostAppointmentRoute, resolveFlow, toAgentRoute } from "@/lib/applicationFlow";
import { VisaConfig } from "@/types/visa";

type AgentApplicationItem = {
  id: string;
  destinationCountry?: string | null;
  purpose?: string | null;
  createdAt?: string;
};

export default function AgentBookingPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [requiresAppointment, setRequiresAppointment] = useState(false);
  const [nextRoute, setNextRoute] = useState("/portal/agent/applicants");
  const [visaConfig, setVisaConfig] = useState<VisaConfig | null>(null);
  const [applications, setApplications] = useState<AgentApplicationItem[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

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
      setVisaConfig(config);
      const flow = resolveFlow(config);
      setRequiresAppointment(flow.requiresAppointment);
      setNextRoute(toAgentRoute(getPostAppointmentRoute(config), selectedApplicationId));
    }
    void loadConfig();
  }, [router, selectedApplicationId]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!selectedApplicationId) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">No Applicant Applications</h1>
        <p className="text-gray-600">Create or open an applicant application first.</p>
        <Button onClick={() => router.push("/portal/agent/applicants")}>Go to Applicants</Button>
      </div>
    );
  }

  if (!requiresAppointment) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Not Required</h1>
        {applications.length > 1 && (
          <div className="max-w-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Application</label>
            <select
              value={selectedApplicationId}
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
        <p className="text-gray-600">This application type does not require an appointment.</p>
        <Button onClick={() => router.push(nextRoute)}>Continue</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.length > 1 && (
        <div className="max-w-sm">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Application</label>
          <select
            value={selectedApplicationId}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedApplicationId(next);
              applicationService.setCurrentApplicationId(next);
            }}
            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.destinationCountry || "-"} - {app.purpose || "-"} ({app.id.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      )}

      <SimpleBookingCalendar
        applicationId={selectedApplicationId}
        slots={visaConfig?.appointment?.slots || []}
        instructions={visaConfig?.appointment?.instructions}
        onBookingComplete={() => router.push(nextRoute)}
        continueLabel={nextRoute.includes("/payment") ? "Continue to Payment" : "Continue"}
      />
    </div>
  );
}
