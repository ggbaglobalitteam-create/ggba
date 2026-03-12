"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/portal/Button";
import SimpleBookingCalendar from "@/components/booking/SimpleBookingCalendar";
import { visaConfigService } from "@/lib/services/visaConfigService";
import { applicationService } from "@/lib/services/applicationService";
import { getPostAppointmentRoute, resolveFlow } from "@/lib/applicationFlow";
import { VisaConfig } from "@/types/visa";

export default function BookingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requiresAppointment, setRequiresAppointment] = useState(false);
  const [nextRoute, setNextRoute] = useState("/portal/applicant/status");
  const [visaConfig, setVisaConfig] = useState<VisaConfig | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const currentId = applicationService.getCurrentApplicationId();
      if (currentId) {
        setApplicationId(currentId);
      } else {
        const list = await applicationService.listApplications().catch(() => []);
        if (list[0]?.id) {
          applicationService.setCurrentApplicationId(list[0].id);
          setApplicationId(list[0].id);
        }
      }

      const config = await visaConfigService.getActiveConfig();
      if (!config) {
        router.push("/portal/applicant/application-form");
        return;
      }
      setVisaConfig(config);
      const flow = resolveFlow(config);
      setRequiresAppointment(flow.requiresAppointment);
      setNextRoute(getPostAppointmentRoute(config));
      setIsLoading(false);
    }
    void init();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C6A96A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!requiresAppointment) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Not Required</h1>
        <p className="text-gray-600">
          This application type does not require an appointment. Continue to the next step.
        </p>
        <Button onClick={() => router.push(nextRoute)}>Continue</Button>
      </div>
    );
  }

  return (
    <SimpleBookingCalendar
      applicationId={applicationId || undefined}
      slots={visaConfig?.appointment?.slots || []}
      instructions={visaConfig?.appointment?.instructions}
      onBookingComplete={() => router.push(nextRoute)}
      continueLabel={nextRoute.includes("/payment") ? "Continue to Payment" : "Continue to Status"}
    />
  );
}
