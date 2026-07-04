import { config } from "@/lib/config";

/**
 * Session token access.
 *
 * In production this reads the Cognito ID token from wherever the auth flow
 * stored it (secure cookie set by the Hosted UI callback, or an in-memory
 * store hydrated by amazon-cognito-identity-js / Amplify).
 *
 * In mock mode we return a stable fake token so the app is fully runnable
 * without AWS. The backend must reject this token in any non-dev environment.
 */
const MOCK_TOKEN = "mock.dev.idtoken";
const STORAGE_KEY = "our-space.session";

interface StoredSession {
  idToken: string;
  userId: string;
  displayName: string;
  expiresAt: number;
}

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed.expiresAt >= Date.now()) return parsed;
    }
  } catch {
    /* fall through */
  }
  // In mock mode, default to a stable "you" identity so the app is usable even
  // before an explicit sign-in. Signing in (incl. as "partner") persists the
  // real identity above, which is what distinguishes two browsers.
  if (config.useMocks) {
    return {
      idToken: MOCK_TOKEN,
      userId: "user_you",
      displayName: "Appy",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
  }
  return null;
}

export function writeSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  // The edge middleware runs server-side and can't see localStorage, so it
  // checks for this cookie's presence to gate "/". It carries no secret (the
  // real bearer token stays in localStorage) — it's a UX-level routing signal
  // only; the backend independently validates the JWT on every request.
  document.cookie = `${STORAGE_KEY}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${STORAGE_KEY}=; path=/; max-age=0`;
}

/** Returns a bearer token for API calls, or null when signed out. */
export async function getIdToken(): Promise<string | null> {
  const session = readSession();
  return session?.idToken ?? null;
}
