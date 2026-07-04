/**
 * Shared domain types for Our Space.
 *
 * These mirror the DynamoDB item shapes served by the Java backend so the
 * frontend can be wired to real data with minimal changes. Keep in sync with
 * the backend model classes under `backend/src/main/java/.../model`.
 */

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  /** Cognito `sub` (stable user id). */
  id: string;
  displayName: string;
  /** Optional avatar URL. */
  avatarUrl?: string;
  /** Convenience flag set client-side for bubble alignment. */
  isSelf?: boolean;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  /** ISO-8601 timestamp (UTC). */
  createdAt: string;
  status: MessageStatus;
  /** Optional client-generated id used to reconcile optimistic messages. */
  clientId?: string;
}

export interface Conversation {
  id: string;
  /** Exactly two participants for Our Space. */
  participantIds: string[];
  title?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Spotify / music
// ---------------------------------------------------------------------------

export interface Artist {
  id: string;
  name: string;
}

export interface Track {
  /** Spotify URI e.g. "spotify:track:xxxx". */
  uri: string;
  id: string;
  name: string;
  artists: Artist[];
  albumName: string;
  albumArtUrl?: string;
  durationMs: number;
}

export interface PlaybackState {
  isConnected: boolean;
  isActive: boolean;
  isPlaying: boolean;
  track: Track | null;
  positionMs: number;
  durationMs: number;
  /** Web Playback SDK device id for this browser tab. */
  deviceId: string | null;
}

export type SpotifyAuthStatus =
  | "unknown"
  | "disconnected"
  | "connecting"
  | "connected"
  | "premium_required"
  | "error";

export interface SpotifyAuthState {
  status: SpotifyAuthStatus;
  /** Spotify display profile once connected. */
  profile?: {
    id: string;
    displayName: string;
    product?: string; // "premium" | "free"
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Music sync (consent-based shared listening)
// ---------------------------------------------------------------------------

export type SyncStatus =
  | "idle"
  | "requested"
  | "waiting_for_partner"
  | "accepted"
  | "countdown"
  | "synced"
  | "drift_detected"
  | "resyncing"
  | "declined"
  | "ended";

export interface MusicSyncSession {
  sessionId: string;
  conversationId: string;
  status: SyncStatus;

  // Track snapshot (denormalized so both clients can render without a lookup)
  trackUri: string;
  trackName: string;
  artist: string;
  albumArtUrl?: string;

  requestedBy: string;
  acceptedBy?: string;

  /** Epoch millis when both clients should begin playback. */
  sharedStartAt?: number;
  /** Playback position (ms) that maps to `sharedStartAt`. */
  startPositionMs: number;

  createdAt: string;
  updatedAt: string;
}

/** Payloads exchanged over the realtime channel. */
export type RealtimeEvent =
  | { type: "chat.message"; message: ChatMessage }
  | { type: "chat.typing"; conversationId: string; userId: string }
  | { type: "sync.requested"; session: MusicSyncSession }
  | { type: "sync.accepted"; session: MusicSyncSession }
  | { type: "sync.declined"; session: MusicSyncSession }
  | { type: "sync.countdown"; session: MusicSyncSession }
  | { type: "sync.started"; session: MusicSyncSession }
  | { type: "sync.track_changed"; session: MusicSyncSession }
  | { type: "sync.tick"; sessionId: string; positionMs: number; at: number }
  | {
      type: "sync.playback";
      sessionId: string;
      by: string;
      isPlaying: boolean;
      positionMs: number;
    }
  | { type: "sync.ended"; sessionId: string };

export type RealtimeEventType = RealtimeEvent["type"];
