/**
 * Shared API fetch helpers.
 * All mutation requests (POST/PATCH) automatically fetch a CSRF token first
 * and include credentials (session cookie) on every request.
 */

async function ensureCsrf(): Promise<string> {
  // Django rotates the CSRF secret when authentication changes (including
  // registration, which also signs the user in). Fetch a token for every
  // mutation so a successful login/register cannot leave a stale cached token.
  const res = await fetch("/api/v1/auth/csrf", { credentials: "include" });
  if (!res.ok) throw new Error("Could not obtain a CSRF token.");
  const data = (await res.json()) as { csrfToken?: string };
  if (!data.csrfToken)
    throw new Error("The CSRF response did not include a token.");
  return data.csrfToken;
}

type ApiResult<T> = { ok: boolean; status: number; data: T };

export async function apiGet<T = unknown>(path: string): Promise<ApiResult<T>> {
  const res = await fetch(`/api/v1/${path}`, { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const csrf = await ensureCsrf();
  const res = await fetch(`/api/v1/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function apiPatch<T = unknown>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const csrf = await ensureCsrf();
  const res = await fetch(`/api/v1/${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}
