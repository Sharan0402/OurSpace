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
  if (config.useMocks) {
    return {
      idToken: MOCK_TOKEN,
      userId: "user_you",
      displayName: "You",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Returns a bearer token for API calls, or null when signed out. */
export async function getIdToken(): Promise<string | null> {
  const session = readSession();
  return session?.idToken ?? null;
}
