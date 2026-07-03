/**
 * Central place to read public runtime configuration.
 * Only NEXT_PUBLIC_* values are safe here (they reach the browser).
 */
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws",
  useMocks: (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  cognito: {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION ?? "us-east-1",
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "",
  },

  spotify: {
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "",
    redirectUri:
      process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ??
      "http://localhost:8080/api/spotify/callback",
  },
} as const;

/** Drift threshold (ms) beyond which we resync shared playback. */
export const SYNC_DRIFT_THRESHOLD_MS = 1200;
/** How often clients broadcast/compare playback position while synced. */
export const SYNC_TICK_INTERVAL_MS = 3000;
/** Countdown length before shared playback begins. */
export const SYNC_COUNTDOWN_SECONDS = 3;
