import type { RequestDetail, Role, TriageRequest, AuditEvent } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(
  path: string,
  options: RequestInit & { role?: Role } = {},
): Promise<T> {
  const { role = "Viewer", ...init } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-role": role,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(", ");
      else if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function listRequests(
  params: Record<string, string | undefined>,
  role: Role,
) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  return request<TriageRequest[]>(`/requests${suffix}`, { role });
}

export function getRequest(id: string, role: Role) {
  return request<RequestDetail>(`/requests/${id}`, { role });
}

export function importFixture(role: Role) {
  return request<{ imported: number; skipped: number; total: number }>(
    "/requests/import",
    { method: "POST", role },
  );
}

export function approveRequest(id: string, reason: string, role: Role) {
  return request<TriageRequest>(`/requests/${id}/approve`, {
    method: "POST",
    role,
    body: JSON.stringify({ reason }),
  });
}

export function rejectRequest(id: string, reason: string, role: Role) {
  return request<TriageRequest>(`/requests/${id}/reject`, {
    method: "POST",
    role,
    body: JSON.stringify({ reason }),
  });
}

export function mergeRequest(
  id: string,
  canonicalExternalId: string,
  reason: string,
  role: Role,
) {
  return request<TriageRequest>(`/requests/${id}/merge`, {
    method: "POST",
    role,
    body: JSON.stringify({ canonicalExternalId, reason }),
  });
}

export function editProposal(
  id: string,
  reason: string,
  proposal: Record<string, unknown>,
  role: Role,
) {
  return request<TriageRequest>(`/requests/${id}/edit`, {
    method: "POST",
    role,
    body: JSON.stringify({ reason, proposal }),
  });
}

export function clarifyRequest(id: string, note: string, role: Role) {
  return request<TriageRequest>(`/requests/${id}/clarify`, {
    method: "POST",
    role,
    body: JSON.stringify({ note }),
  });
}

export function listAudit(role: Role, limit = 100) {
  return request<AuditEvent[]>(`/audit?limit=${limit}`, { role });
}
