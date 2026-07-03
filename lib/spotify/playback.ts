import type { SpotifyPlayer } from "./sdk-types";

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";

let sdkPromise: Promise<void> | null = null;

/** Injects the Spotify Web Playback SDK script once and resolves when ready. */
export function loadSpotifySdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Spotify SDK requires a browser"));
  }
  if (window.Spotify) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (!existing) {
      const script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      script.onerror = () =>
        reject(new Error("Failed to load the Spotify Web Playback SDK"));
      document.body.appendChild(script);
    }
  });
  return sdkPromise;
}

export interface CreatePlayerOptions {
  name: string;
  getToken: () => Promise<string>;
}

/**
 * Creates and connects a Web Playback SDK player. Returns the player plus its
 * device id. Playback errors (auth/account/playback) surface via onError.
 */
export async function createSpotifyPlayer(
  opts: CreatePlayerOptions,
  handlers: {
    onReady: (deviceId: string) => void;
    onNotReady: (deviceId: string) => void;
    onStateChange: (state: import("./sdk-types").WebPlaybackState | null) => void;
    onError: (kind: string, message: string) => void;
  },
): Promise<SpotifyPlayer> {
  await loadSpotifySdk();
  if (!window.Spotify) throw new Error("Spotify SDK unavailable");

  const player = new window.Spotify.Player({
    name: opts.name,
    volume: 0.8,
    getOAuthToken: (cb) => {
      opts
        .getToken()
        .then((t) => cb(t))
        .catch(() => handlers.onError("authentication_error", "token fetch failed"));
    },
  });

  player.addListener("ready", ({ device_id }) => handlers.onReady(device_id));
  player.addListener("not_ready", ({ device_id }) =>
    handlers.onNotReady(device_id),
  );
  player.addListener("player_state_changed", handlers.onStateChange);

  (
    [
      "initialization_error",
      "authentication_error",
      "account_error",
      "playback_error",
    ] as const
  ).forEach((kind) => {
    player.addListener(kind, ({ message }) => handlers.onError(kind, message));
  });

  await player.connect();
  return player;
}
