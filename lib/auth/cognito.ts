import { config } from "@/lib/config";

/**
 * Cognito auth adapter.
 *
 * This is intentionally a thin, swappable layer. For production you would back
 * these methods with `amazon-cognito-identity-js` (USER_PASSWORD_AUTH / SRP) or
 * the Cognito Hosted UI (redirect flow). The rest of the app only depends on
 * this interface, so swapping the implementation touches nothing else.
 *
 * "Only two authorized users" is enforced in two places:
 *   1. The Cognito User Pool contains exactly the two invited users
 *      (self sign-up disabled). No one else can obtain a token.
 *   2. The Java backend additionally checks the caller's `sub` against an
 *      allow-list of the two authorized user ids on every request.
 */

export interface SignInResult {
  idToken: string;
  userId: string;
  displayName: string;
  expiresAt: number;
}

export interface CognitoAdapter {
  signIn(email: string, password: string): Promise<SignInResult>;
  signOut(): Promise<void>;
  /** Hosted UI login URL (if you prefer redirect-based auth). */
  hostedUiUrl(): string | null;
}

function buildHostedUiUrl(): string | null {
  if (!config.cognito.domain || !config.cognito.clientId) return null;
  const redirect = `${config.appUrl}/auth/callback`;
  const params = new URLSearchParams({
    client_id: config.cognito.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirect,
  });
  return `${config.cognito.domain}/login?${params.toString()}`;
}

/**
 * Mock adapter used when NEXT_PUBLIC_USE_MOCKS=true. Accepts any of the two
 * demo accounts so you can explore the app locally.
 */
const mockAdapter: CognitoAdapter = {
  async signIn(email: string): Promise<SignInResult> {
    await new Promise((r) => setTimeout(r, 400));
    const isPartner = email.toLowerCase().includes("partner");
    return {
      idToken: "mock.dev.idtoken",
      userId: isPartner ? "user_partner" : "user_you",
      displayName: isPartner ? "Lakku" : "Appy",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
  },
  async signOut() {
    await new Promise((r) => setTimeout(r, 150));
  },
  hostedUiUrl: () => buildHostedUiUrl(),
};

/**
 * Real adapter for the small private deployment: verifies the username/password
 * against the Java backend's built-in two-person auth (POST /api/auth/login),
 * which returns a signed session token used as the bearer for all API/WS calls.
 */
const backendAdapter: CognitoAdapter = {
  async signIn(email: string, password: string): Promise<SignInResult> {
    const res = await fetch(`${config.apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email.trim(), password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? "Invalid username or password");
    }
    return (await res.json()) as SignInResult;
  },
  async signOut() {
    /* stateless JWT — the client just discards its stored token */
  },
  hostedUiUrl: () => buildHostedUiUrl(),
};

export const cognito: CognitoAdapter = config.useMocks
  ? mockAdapter
  : backendAdapter;
