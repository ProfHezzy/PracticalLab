import type { ApiError } from "@practicallab/shared-types";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiError["error"] };

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null || !("error" in value))
    return false;
  const error = value.error;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string" &&
    "details" in error
  );
}

async function readApiError(
  response: Response,
): Promise<ApiError["error"] | null> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return null;
  }
  return isApiError(payload) ? payload.error : null;
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  const method = (init?.method ?? "GET").toUpperCase();
  const isUnsafeMethod = !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);

  if (isUnsafeMethod) {
    const csrfResponse = await fetch("/api/v1/auth/csrf", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const csrfPayload: unknown = csrfResponse.ok
      ? await csrfResponse.json()
      : null;
    const csrfToken =
      typeof csrfPayload === "object" &&
      csrfPayload !== null &&
      "csrfToken" in csrfPayload &&
      typeof csrfPayload.csrfToken === "string"
        ? csrfPayload.csrfToken
        : null;

    if (!csrfResponse.ok || !csrfToken) {
      return {
        ok: false,
        status: csrfResponse.status || 503,
        error: {
          code: "csrf_unavailable",
          message: "This request could not be secured. Please try again.",
          details: {},
        },
      };
    }
    headers.set("X-CSRFToken", csrfToken);
  }

  const response = await fetch(`/api/v1/${path.replace(/^\/+/, "")}`, {
    ...init,
    credentials: "same-origin",
    headers,
  });

  if (!response.ok) {
    const error = await readApiError(response);
    return {
      ok: false,
      status: response.status,
      error: error
        ? error
        : {
            code: "request_failed",
            message: "The request could not be completed.",
            details: {},
          },
    };
  }

  return { ok: true, data: (await response.json()) as T };
}
