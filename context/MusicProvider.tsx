"use client";

/**
 * MusicProvider — the single abstraction the UI talks to for ALL music
 * behavior. UI components never import Spotify APIs directly; they call the
 * generic methods exposed here (connectSpotify, searchTracks, playTrack, …).
 *
 * The concrete implementation below is the SpotifyMusicProvider. Swapping to a
 * different backend (e.g. Apple Music) would mean writing another provider that
 * satisfies `MusicProviderApi` — no UI changes required.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  MusicSyncSession,
  PlaybackState,
  SpotifyAuthState,
  SyncStatus,
  Track,
} from "@/types";
import {
  SYNC_COUNTDOWN_SECONDS,
  SYNC_DRIFT_THRESHOLD_MS,
  SYNC_TICK_INTERVAL_MS,
} from "@/lib/config";
import { config } from "@/lib/config";
import { uid } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRealtime } from "@/lib/realtime/RealtimeProvider";
import type { SpotifyPlayer } from "@/lib/spotify/sdk-types";
import { createSpotifyPlayer } from "@/lib/spotify/playback";
import {
  beginSpotifyLogin,
  fetchSpotifyToken,
  searchTracks as spotifySearch,
  startPlayback,
} from "@/lib/spotify/api";
import { createSyncSession, patchSyncSession } from "@/lib/api/sync";

const CONVERSATION_ID = "conv_our_space";

export interface MusicProviderApi {
  // ---- auth ----
  auth: SpotifyAuthState;
  connectSpotify: () => void;

  // ---- player ----
  playback: PlaybackState;
  searchTracks: (query: string) => Promise<Track[]>;
  playTrack: (uri: string, positionMs?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;

  // ---- sync ----
  syncStatus: SyncStatus;
  syncSession: MusicSyncSession | null;
  /** Incoming request awaiting this user's consent (partner initiated). */
  incomingRequest: MusicSyncSession | null;
  countdownValue: number | null;
  requestSync: (trackUri: string) => Promise<void>;
  acceptSync: (sessionId: string) => Promise<void>;
  declineSync: (sessionId: string) => Promise<void>;
  leaveSync: () => void;
}

const MusicContext = createContext<MusicProviderApi | null>(null);

export function SpotifyMusicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const realtime = useRealtime();

  const [auth, setAuth] = useState<SpotifyAuthState>({ status: "unknown" });
  const [playback, setPlayback] = useState<PlaybackState>({
    isConnected: false,
    isActive: false,
    isPlaying: false,
    track: null,
    positionMs: 0,
    durationMs: 0,
    deviceId: null,
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncSession, setSyncSession] = useState<MusicSyncSession | null>(null);
  const [incomingRequest, setIncomingRequest] =
    useState<MusicSyncSession | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  const playerRef = useRef<SpotifyPlayer | null>(null);
  const tokenRef = useRef<{ value: string; expiresAt: number } | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------
  // Token management (short-lived Spotify access token from the backend)
  // ---------------------------------------------------------------------
  const getToken = useCallback(async (): Promise<string> => {
    const cached = tokenRef.current;
    if (cached && cached.expiresAt - Date.now() > 30_000) return cached.value;
    const res = await fetchSpotifyToken();
    tokenRef.current = { value: res.accessToken, expiresAt: res.expiresAt };
    if (res.product && res.product !== "premium") {
      setAuth((a) => ({ ...a, status: "premium_required" }));
    }
    return res.accessToken;
  }, []);

  // ---------------------------------------------------------------------
  // Connect Spotify: OAuth (redirect) + Web Playback SDK device
  // ---------------------------------------------------------------------
  const connectSpotify = useCallback(() => {
    if (config.useMocks) {
      // Simulate a connected premium account + active device.
      setAuth({
        status: "connected",
        profile: { id: "spotify_mock", displayName: "You", product: "premium" },
      });
      setPlayback((p) => ({
        ...p,
        isConnected: true,
        isActive: true,
        deviceId: "mock-device",
      }));
      return;
    }
    setAuth((a) => ({ ...a, status: "connecting" }));
    beginSpotifyLogin();
  }, []);

  // Initialize the SDK player once we (believe we) have a linked account.
  useEffect(() => {
    if (config.useMocks) return;
    let cancelled = false;

    async function init() {
      try {
        // Probe token; 401 means not linked yet.
        await getToken();
        if (cancelled) return;
        setAuth((a) =>
          a.status === "premium_required"
            ? a
            : { ...a, status: "connected" },
        );

        const player = await createSpotifyPlayer(
          { name: "Our Space 💛", getToken },
          {
            onReady: (deviceId) =>
              setPlayback((p) => ({
                ...p,
                isConnected: true,
                deviceId,
              })),
            onNotReady: () =>
              setPlayback((p) => ({ ...p, isActive: false })),
            onStateChange: (state) => {
              if (!state) {
                setPlayback((p) => ({ ...p, isActive: false }));
                return;
              }
              const ct = state.track_window.current_track;
              setPlayback((p) => ({
                ...p,
                isActive: true,
                isPlaying: !state.paused,
                positionMs: state.position,
                durationMs: state.duration,
                track: {
                  uri: ct.uri,
                  id: ct.id,
                  name: ct.name,
                  durationMs: ct.duration_ms,
                  albumName: ct.album.name,
                  albumArtUrl: ct.album.images?.[0]?.url,
                  artists: ct.artists.map((a) => ({ id: a.uri, name: a.name })),
                },
              }));
            },
            onError: (kind, message) => {
              if (kind === "account_error") {
                setAuth({ status: "premium_required", error: message });
              } else if (kind === "authentication_error") {
                setAuth({ status: "disconnected", error: message });
              } else {
                setAuth((a) => ({ ...a, status: "error", error: message }));
              }
            },
          },
        );
        playerRef.current = player;
      } catch {
        if (!cancelled) setAuth({ status: "disconnected" });
      }
    }
    init();

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [getToken]);

  // Smooth local progress bar between SDK state pushes.
  useEffect(() => {
    if (positionTimer.current) clearInterval(positionTimer.current);
    if (!playback.isPlaying) return;
    positionTimer.current = setInterval(() => {
      setPlayback((p) =>
        p.isPlaying
          ? { ...p, positionMs: Math.min(p.positionMs + 1000, p.durationMs) }
          : p,
      );
    }, 1000);
    return () => {
      if (positionTimer.current) clearInterval(positionTimer.current);
    };
  }, [playback.isPlaying]);

  // ---------------------------------------------------------------------
  // Player controls (generic methods the UI calls)
  // ---------------------------------------------------------------------
  const searchTracks = useCallback(
    async (query: string) => {
      const token = config.useMocks ? "mock" : await getToken();
      return spotifySearch(query, token);
    },
    [getToken],
  );

  const playTrack = useCallback(
    async (uri: string, positionMs = 0) => {
      if (config.useMocks) {
        setPlayback((p) => ({
          ...p,
          isActive: true,
          isPlaying: true,
          positionMs,
          durationMs: p.durationMs || 210000,
          track: p.track ?? {
            uri,
            id: uri.split(":").pop() ?? uri,
            name: "Our Song",
            albumName: "",
            artists: [{ id: "a", name: "Spotify" }],
            durationMs: 210000,
          },
        }));
        return;
      }
      const token = await getToken();
      const deviceId = playback.deviceId;
      if (!deviceId) throw new Error("No active playback device yet");
      await startPlayback(deviceId, uri, positionMs, token);
    },
    [getToken, playback.deviceId],
  );

  const pause = useCallback(async () => {
    if (config.useMocks) return setPlayback((p) => ({ ...p, isPlaying: false }));
    await playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    if (config.useMocks) return setPlayback((p) => ({ ...p, isPlaying: true }));
    await playerRef.current?.resume();
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    if (config.useMocks)
      return setPlayback((p) => ({ ...p, positionMs }));
    await playerRef.current?.seek(positionMs);
  }, []);

  const next = useCallback(async () => {
    if (config.useMocks) return;
    await playerRef.current?.nextTrack();
  }, []);

  const previous = useCallback(async () => {
    if (config.useMocks) return;
    await playerRef.current?.previousTrack();
  }, []);

  // ---------------------------------------------------------------------
  // Music sync state machine
  // ---------------------------------------------------------------------
  const clearSyncTimers = useCallback(() => {
    if (tickTimer.current) clearInterval(tickTimer.current);
    tickTimer.current = null;
  }, []);

  const runCountdownThenPlay = useCallback(
    (session: MusicSyncSession) => {
      setSyncSession(session);
      setSyncStatus("countdown");
      const startAt = session.sharedStartAt ?? Date.now();

      const tick = () => {
        const remainingMs = startAt - Date.now();
        if (remainingMs <= 0) {
          setCountdownValue(null);
          // Begin shared playback, offsetting for any time already elapsed.
          const elapsed = Math.max(0, Date.now() - startAt);
          void playTrack(session.trackUri, session.startPositionMs + elapsed);
          setSyncStatus("synced");
          return;
        }
        setCountdownValue(Math.ceil(remainingMs / 1000));
        setTimeout(tick, 200);
      };
      tick();
    },
    [playTrack],
  );

  // Compare positions while synced; correct drift.
  useEffect(() => {
    if (syncStatus !== "synced" || !syncSession) {
      clearSyncTimers();
      return;
    }
    clearSyncTimers();
    tickTimer.current = setInterval(async () => {
      const startAt = syncSession.sharedStartAt ?? Date.now();
      const expected = syncSession.startPositionMs + (Date.now() - startAt);
      // Broadcast our position so the partner can compare too.
      realtime?.publish(CONVERSATION_ID, {
        type: "sync.tick",
        sessionId: syncSession.sessionId,
        positionMs: playback.positionMs,
        at: Date.now(),
      });
      const drift = Math.abs(playback.positionMs - expected);
      if (drift > SYNC_DRIFT_THRESHOLD_MS) {
        setSyncStatus("resyncing");
        await seek(expected);
        setSyncStatus("synced");
      }
    }, SYNC_TICK_INTERVAL_MS);
    return clearSyncTimers;
  }, [syncStatus, syncSession, playback.positionMs, realtime, seek, clearSyncTimers]);

  // React to realtime sync events from the partner.
  useEffect(() => {
    if (!realtime) return;
    const unsub = realtime.subscribe(CONVERSATION_ID, (event) => {
      switch (event.type) {
        case "sync.requested": {
          if (event.session.requestedBy !== user?.id) {
            setIncomingRequest(event.session);
            setSyncStatus("requested");
          }
          break;
        }
        case "sync.accepted":
        case "sync.countdown":
        case "sync.started": {
          setIncomingRequest(null);
          runCountdownThenPlay(event.session);
          break;
        }
        case "sync.declined": {
          if (event.session.requestedBy === user?.id) {
            setSyncStatus("declined");
            setTimeout(() => setSyncStatus("idle"), 2500);
          }
          break;
        }
        case "sync.ended": {
          clearSyncTimers();
          setSyncSession(null);
          setIncomingRequest(null);
          setSyncStatus("ended");
          setTimeout(() => setSyncStatus("idle"), 1500);
          break;
        }
        default:
          break;
      }
    });
    return unsub;
  }, [realtime, user?.id, runCountdownThenPlay, clearSyncTimers]);

  const requestSync = useCallback(
    async (trackUri: string) => {
      if (!user) return;
      const now = new Date().toISOString();
      const base: MusicSyncSession = {
        sessionId: uid("sync"),
        conversationId: CONVERSATION_ID,
        status: "requested",
        trackUri,
        trackName: playback.track?.name ?? "Selected track",
        artist: playback.track?.artists.map((a) => a.name).join(", ") ?? "",
        albumArtUrl: playback.track?.albumArtUrl,
        requestedBy: user.id,
        startPositionMs: playback.positionMs,
        createdAt: now,
        updatedAt: now,
      };
      const session = config.useMocks ? base : await createSyncSession(base);
      setSyncSession(session);
      setSyncStatus("waiting_for_partner");
      realtime?.publish(CONVERSATION_ID, { type: "sync.requested", session });
    },
    [user, playback.track, playback.positionMs, realtime],
  );

  const acceptSync = useCallback(
    async (sessionId: string) => {
      const req = incomingRequest;
      if (!req || !user) return;
      const sharedStartAt = Date.now() + SYNC_COUNTDOWN_SECONDS * 1000 + 500;
      const accepted: MusicSyncSession = {
        ...req,
        status: "accepted",
        acceptedBy: user.id,
        sharedStartAt,
        updatedAt: new Date().toISOString(),
      };
      if (!config.useMocks) {
        await patchSyncSession(sessionId, {
          status: "accepted",
          acceptedBy: user.id,
          sharedStartAt,
        });
      }
      realtime?.publish(CONVERSATION_ID, {
        type: "sync.accepted",
        session: accepted,
      });
      runCountdownThenPlay(accepted);
    },
    [incomingRequest, user, realtime, runCountdownThenPlay],
  );

  const declineSync = useCallback(
    async (sessionId: string) => {
      const req = incomingRequest;
      if (!req) return;
      const declined: MusicSyncSession = {
        ...req,
        status: "declined",
        updatedAt: new Date().toISOString(),
      };
      if (!config.useMocks) {
        await patchSyncSession(sessionId, { status: "declined" });
      }
      realtime?.publish(CONVERSATION_ID, {
        type: "sync.declined",
        session: declined,
      });
      setIncomingRequest(null);
      setSyncStatus("idle");
    },
    [incomingRequest, realtime],
  );

  const leaveSync = useCallback(() => {
    clearSyncTimers();
    if (syncSession) {
      realtime?.publish(CONVERSATION_ID, {
        type: "sync.ended",
        sessionId: syncSession.sessionId,
      });
    }
    setSyncSession(null);
    setIncomingRequest(null);
    setSyncStatus("idle");
  }, [syncSession, realtime, clearSyncTimers]);

  const value = useMemo<MusicProviderApi>(
    () => ({
      auth,
      connectSpotify,
      playback,
      searchTracks,
      playTrack,
      pause,
      resume,
      seek,
      next,
      previous,
      syncStatus,
      syncSession,
      incomingRequest,
      countdownValue,
      requestSync,
      acceptSync,
      declineSync,
      leaveSync,
    }),
    [
      auth,
      connectSpotify,
      playback,
      searchTracks,
      playTrack,
      pause,
      resume,
      seek,
      next,
      previous,
      syncStatus,
      syncSession,
      incomingRequest,
      countdownValue,
      requestSync,
      acceptSync,
      declineSync,
      leaveSync,
    ],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

/** Generic alias so the app can wrap with <MusicProvider> conceptually. */
export const MusicProvider = SpotifyMusicProvider;

export function useMusicContext(): MusicProviderApi {
  const ctx = useContext(MusicContext);
  if (!ctx)
    throw new Error("useMusicContext must be used within <MusicProvider>");
  return ctx;
}
