type Primitive = string | number | boolean | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePrimitive(value: Primitive): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value.trim() || "-";
  return String(value);
}

function flattenEntries(value: unknown, keyPrefix = "", out: Array<{ key: string; value: string }> = []) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push({ key: keyPrefix, value: "[]" });
      return out;
    }
    value.forEach((item, idx) => {
      flattenEntries(item, `${keyPrefix}[${idx}]`, out);
    });
    return out;
  }

  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    if (keys.length === 0) {
      out.push({ key: keyPrefix, value: "{}" });
      return out;
    }

    for (const key of keys) {
      if (key === "__submittedAt" || key === "currentStep" || key === "prefilledFields") continue;
      const nextPrefix = keyPrefix ? `${keyPrefix}.${key}` : key;
      flattenEntries(value[key], nextPrefix, out);
    }
    return out;
  }

  out.push({ key: keyPrefix, value: normalizePrimitive(value as Primitive) });
  return out;
}

function wrapLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line];
  const words = line.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [line.slice(0, maxChars)];
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(lines: string[]): Buffer {
  const linesPerPage = 48;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const firstPageObjectId = 3;
  const pageCount = Math.max(1, pages.length);
  const pageObjectIds = Array.from({ length: pageCount }, (_, idx) => firstPageObjectId + idx * 2);
  const contentObjectIds = pageObjectIds.map((id) => id + 1);
  const fontObjectId = firstPageObjectId + pageCount * 2;

  objects.push(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`);

  for (let i = 0; i < pageCount; i += 1) {
    const pageObjectId = pageObjectIds[i];
    const contentObjectId = contentObjectIds[i];
    const pageLines = pages[i] || [];

    const textOps = [
      "BT",
      "/F1 10 Tf",
      "50 790 Td",
      "14 TL",
      ...pageLines.map((line, idx) => `${idx === 0 ? "" : "T* " }(${escapePdfText(line)}) Tj`),
      "ET",
    ].join("\n");

    objects[pageObjectId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId - 1] = `<< /Length ${Buffer.byteLength(textOps, "utf8")} >>\nstream\n${textOps}\nendstream`;
  }

  objects[fontObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

export function createApplicationPdf(params: {
  applicationId: string;
  purpose: string;
  destinationCountry: string;
  submittedAtIso: string;
  formData: unknown;
}) {
  const { applicationId, purpose, destinationCountry, submittedAtIso, formData } = params;
  const entries = flattenEntries(formData);
  const generatedAt = new Date().toISOString();
  const lines = [
    "GGBA Global - Submitted Application Form",
    "",
    `Application ID: ${applicationId}`,
    `Purpose: ${purpose}`,
    `Destination Country: ${destinationCountry}`,
    `Submitted At: ${submittedAtIso}`,
    `PDF Generated At: ${generatedAt}`,
    "",
    "Form Data",
    "---------",
  ];

  for (const entry of entries) {
    const base = `${entry.key || "field"}: ${entry.value}`;
    lines.push(...wrapLine(base, 95));
  }

  return buildPdf(lines);
}
