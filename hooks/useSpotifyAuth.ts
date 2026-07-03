"use client";

import { useMusicContext } from "@/context/MusicProvider";

/**
 * Exposes Spotify connection state + the connect action.
 * UI only ever sees generic state — never Spotify SDK internals.
 */
export function useSpotifyAuth() {
  const { auth, connectSpotify } = useMusicContext();
  return {
    status: auth.status,
    profile: auth.profile,
    error: auth.error,
    isConnected: auth.status === "connected",
    isPremiumRequired: auth.status === "premium_required",
    connectSpotify,
  };
}
