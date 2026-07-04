import { config } from "@/lib/config";
import { getIdToken, readSession } from "@/lib/auth/session";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the Cognito bearer token (e.g. health checks). */
  anonymous?: boolean;
}

/**
 * Thin fetch wrapper for the Java backend. Attaches the Cognito ID token as a
 * bearer credential and normalizes error handling. All feature code should go
 * through the typed helpers in `lib/api/*` rather than calling fetch directly.
 */
export async function apiFetch<T>(
  path: string,
  { body, anonymous, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${config.apiBaseUrl}${path}`;

  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (!anonymous) {
    const token = await getIdToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
    // Dev-only identity hint. The backend honors this ONLY when Cognito is
    // disabled (local dev); in production the verified JWT `sub` wins and this
    // header is ignored. Lets two browsers act as distinct users without Cognito.
    const uid = readSession()?.userId;
    if (uid) finalHeaders.set("X-Dev-User", uid);
  }

  const res = await fetch(url, {
    ...init,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : typeof payload === "string" && payload) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, payload);
  }

  return payload as T;
}
