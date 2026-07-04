/**
 * Central place to read public runtime configuration.
 * Only NEXT_PUBLIC_* values are safe here (they reach the browser).
 */
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws",
  useMocks: (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true",
  // When true, realtime (chat + sync events) goes over the backend STOMP
  // WebSocket instead of the in-browser BroadcastChannel — required to test
  // across TWO DIFFERENT BROWSERS. Auth/chat history can still stay mocked.
  realtimeLive:
    (process.env.NEXT_PUBLIC_REALTIME_LIVE ?? "false") === "true" ||
    (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") !== "true",
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
      "http://127.0.0.1:8080/api/spotify/callback",
    // When true, Spotify uses REAL OAuth/SDK/Web API against the Java backend,
    // even while auth + realtime stay mocked. Lets you test Spotify without
    // setting up Cognito. Requires the backend running with Spotify creds.
    live: (process.env.NEXT_PUBLIC_SPOTIFY_LIVE ?? "false") === "true",
  },
} as const;

/** Drift threshold (ms) beyond which the follower snaps to the leader. */
export const SYNC_DRIFT_THRESHOLD_MS = 1000;
/** How often the leader broadcasts its position for the follower to match. */
export const SYNC_TICK_INTERVAL_MS = 2000;
/** Countdown length before shared playback begins. */
export const SYNC_COUNTDOWN_SECONDS = 3;
