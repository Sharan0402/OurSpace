import type { Track } from "@/types";
import { apiFetch } from "@/lib/api/client";
import { config } from "@/lib/config";
import { readSession } from "@/lib/auth/session";
import { MOCK_TRACKS } from "@/data/mockData";

/**
 * Spotify Web API access.
 *
 * The client secret NEVER lives here. The Java backend performs the OAuth code
 * exchange + refresh and exposes a short-lived access token via
 * `GET /api/spotify/token`. Search can also be proxied through the backend to
 * avoid exposing tokens at all; here we call the Spotify Web API directly with
 * the short-lived token for lower latency, which is safe (access tokens are
 * meant for the client; only the refresh token/secret must stay server-side).
 */

export interface SpotifyTokenResponse {
  accessToken: string;
  expiresAt: number; // epoch ms
  product?: string; // "premium" | "free"
}

export async function fetchSpotifyToken(): Promise<SpotifyTokenResponse> {
  if (!config.spotify.live) {
    return {
      accessToken: "mock-access-token",
      expiresAt: Date.now() + 55 * 60 * 1000,
      product: "premium",
    };
  }
  return apiFetch<SpotifyTokenResponse>("/api/spotify/token");
}

/** Forget this user's Spotify link on the backend so they can connect afresh. */
export async function disconnectSpotify(): Promise<void> {
  if (!config.spotify.live) return;
  await apiFetch<void>("/api/spotify/token", { method: "DELETE" });
}

/** Kick off the OAuth flow by sending the user to the backend's login route. */
export function beginSpotifyLogin(): void {
  if (!config.spotify.live) return;
  const uid = readSession()?.userId ?? "";
  const params = new URLSearchParams({ uid, returnTo: config.appUrl });
  window.location.href = `${config.apiBaseUrl}/api/spotify/login?${params.toString()}`;
}

interface RawSpotifyTrack {
  uri: string;
  id: string;
  name: string;
  duration_ms: number;
  artists: { id: string; name: string }[];
  album: { name: string; images: { url: string }[] };
}

function mapTrack(t: RawSpotifyTrack): Track {
  return {
    uri: t.uri,
    id: t.id,
    name: t.name,
    durationMs: t.duration_ms,
    artists: t.artists.map((a) => ({ id: a.id, name: a.name })),
    albumName: t.album?.name ?? "",
    albumArtUrl: t.album?.images?.[0]?.url,
  };
}

export async function searchTracks(
  query: string,
  accessToken: string,
): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];

  if (!config.spotify.live) {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_TRACKS.filter(
      (t) =>
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.artists.some((a) => a.name.toLowerCase().includes(q.toLowerCase())),
    );
  }

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "track");
  // Spotify apps in Development Mode cap search `limit` at 10 (higher values
  // return HTTP 400 "Invalid limit"). Request extended quota to raise this.
  url.searchParams.set("limit", "10");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify search failed (${res.status})`);
  }
  const data = (await res.json()) as { tracks: { items: RawSpotifyTrack[] } };
  return data.tracks.items.map(mapTrack);
}

/**
 * Transfer playback / start a track on a specific device via the Web API.
 * Used to begin playback on this browser's Web Playback SDK device.
 */
export async function startPlayback(
  deviceId: string,
  trackUri: string,
  positionMs: number,
  accessToken: string,
): Promise<void> {
  if (!config.spotify.live) return;
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri], position_ms: positionMs }),
    },
  );
  if (!res.ok && res.status !== 202 && res.status !== 204) {
    throw new Error(`Spotify play failed (${res.status})`);
  }
}

export async function transferPlaybackHere(
  deviceId: string,
  accessToken: string,
): Promise<void> {
  if (!config.spotify.live) return;
  await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
}
