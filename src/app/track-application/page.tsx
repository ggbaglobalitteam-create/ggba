import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function TrackApplicationPage() {
  const session = await auth();
  const role = String((session?.user as { role?: string } | undefined)?.role || "").toUpperCase();

  if (!session?.user) {
    redirect("/portal/login");
  }

  if (role === "ADMIN") {
    redirect("/portal/admin/dashboard");
  }

  if (role === "AGENT") {
    redirect("/portal/agent/dashboard");
  }

  redirect("/portal/applicant/dashboard");
}
