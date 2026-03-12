import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type ApiErrorShape = { error: string; code?: string };

export function jsonError(status: number, error: string, code?: string) {
  return NextResponse.json({ error, code } satisfies ApiErrorShape, { status });
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export function getSessionRole(session: any): "APPLICANT" | "AGENT" | "ADMIN" | null {
  const raw = (session?.user as any)?.role;
  if (!raw) return null;
  const upper = String(raw).toUpperCase();
  if (upper === "APPLICANT" || upper === "AGENT" || upper === "ADMIN") return upper;
  return null;
}

export function getSessionUserId(session: any): string | null {
  const id = (session?.user as any)?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

