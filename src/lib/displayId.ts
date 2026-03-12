function compactToken(id?: string | null) {
  if (!id) return "-";

  const normalized = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (!normalized) return "-";

  return normalized.slice(-6).padStart(6, "0");
}

export function formatCompactId(id?: string | null) {
  return compactToken(id);
}

export function formatAgentRef(id?: string | null) {
  const token = compactToken(id);
  return token === "-" ? token : `AGT-${token}`;
}

export function formatApplicantRef(id?: string | null) {
  const token = compactToken(id);
  return token === "-" ? token : `APP-${token}`;
}

export function formatApplicationRef(id?: string | null) {
  const token = compactToken(id);
  return token === "-" ? token : `APP-${token}`;
}
