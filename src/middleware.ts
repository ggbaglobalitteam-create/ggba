import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getToken } from "next-auth/jwt";

const PUBLIC_PORTAL_PATHS = new Set([
  "/portal/login",
  "/portal/register",
  "/portal/verify-otp",
]);
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

async function getAuthToken(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const prefersSecureCookie = req.nextUrl.protocol === "https:" || forwardedProto === "https";

  const primary = await getToken({ req, secret: authSecret, secureCookie: prefersSecureCookie });
  if (primary) return primary;

  // Fallback for environments/proxies where protocol inference differs from cookie naming.
  return getToken({ req, secret: authSecret, secureCookie: !prefersSecureCookie });
}

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  if (!path.startsWith("/portal")) return NextResponse.next();

  const token = await getAuthToken(req);

  if (PUBLIC_PORTAL_PATHS.has(path)) {
    if (!token) return NextResponse.next();
    const url = nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!token) {
    const url = nextUrl.clone();
    url.pathname = "/portal/login";
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  // If user lands on /portal, send to role dashboard
  if (path === "/portal") {
    const roleCandidate = typeof (token as { role?: unknown }).role === "string"
      ? (token as { role?: string }).role!.toLowerCase()
      : "";
    const role = roleCandidate === "applicant" || roleCandidate === "agent" || roleCandidate === "admin"
      ? roleCandidate
      : "applicant";
    const url = nextUrl.clone();
    url.pathname = `/portal/${role}/dashboard`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
