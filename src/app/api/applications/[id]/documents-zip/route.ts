import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, jsonError, requireSession } from "@/lib/api/routeUtils";
import { createZip } from "@/lib/zip";

function cleanFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_").replace(/\s+/g, "_");
}

function ensureUniqueFileName(name: string, used: Set<string>) {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }

  const dotIndex = name.lastIndexOf(".");
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const ext = dotIndex > 0 ? name.slice(dotIndex) : "";
  let counter = 2;
  let candidate = `${base}_${counter}${ext}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${base}_${counter}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const role = getSessionRole(session);
  const userId = getSessionUserId(session);
  if (!role || !userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  const app = await prisma.application.findUnique({
    where: { id: ctx.params.id },
    include: {
      documents: {
        orderBy: { createdAt: "asc" },
      },
      applicant: {
        select: { id: true },
      },
    },
  });

  if (!app) return jsonError(404, "Not found", "NOT_FOUND");

  if (role === "APPLICANT" && app.applicantId !== userId) return jsonError(403, "Forbidden", "FORBIDDEN");
  if (role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId }, select: { id: true } });
    if (!agent || app.agentId !== agent.id) return jsonError(403, "Forbidden", "FORBIDDEN");
  }

  const fileDocs = app.documents.filter((doc) => Boolean(doc.fileUrl));
  if (fileDocs.length === 0) return jsonError(404, "No document files available", "NOT_FOUND");

  const usedNames = new Set<string>();
  const entries = [];

  for (const doc of fileDocs) {
    const response = await fetch(doc.fileUrl as string);
    if (!response.ok) continue;

    const data = new Uint8Array(await response.arrayBuffer());
    const fileName = ensureUniqueFileName(
      cleanFileName(doc.name || doc.documentId || `document_${doc.id}`),
      usedNames
    );

    entries.push({
      name: fileName,
      data,
      lastModified: new Date(doc.updatedAt),
    });
  }

  if (entries.length === 0) {
    return jsonError(502, "Unable to download document files", "FILE_FETCH_FAILED");
  }

  const zipBytes = createZip(entries);
  const archiveName = `application_${cleanFileName(app.id)}_documents.zip`;

  return new NextResponse(zipBytes, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${archiveName}"`,
      "content-length": String(zipBytes.length),
      "cache-control": "no-store",
    },
  });
}
