/* Minimal ambient types for the Spotify Web Playback SDK (window.Spotify). */

export interface SpotifyPlayerInit {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

export interface WebPlaybackTrack {
  uri: string;
  id: string;
  name: string;
  duration_ms: number;
  artists: { uri: string; name: string }[];
  album: { uri: string; name: string; images: { url: string }[] };
}

export interface WebPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: WebPlaybackTrack;
  };
}

export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: "ready", cb: (e: { device_id: string }) => void): void;
  addListener(
    event: "not_ready",
    cb: (e: { device_id: string }) => void,
  ): void;
  addListener(
    event: "player_state_changed",
    cb: (state: WebPlaybackState | null) => void,
  ): void;
  addListener(
    event:
      | "initialization_error"
      | "authentication_error"
      | "account_error"
      | "playback_error",
    cb: (e: { message: string }) => void,
  ): void;
  removeListener(event: string): void;
  getCurrentState(): Promise<WebPlaybackState | null>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  /**
   * Unlocks audio output on this device. Must be called from within a user
   * gesture so later (event-driven) playback isn't blocked by autoplay policy.
   */
  activateElement?(): Promise<void>;
}

declare global {
  interface Window {
    Spotify?: {
      Player: new (init: SpotifyPlayerInit) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

export {};
