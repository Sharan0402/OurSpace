"use client";

import { useMusicContext } from "@/context/MusicProvider";

/**
 * Generic music player controls. Components call these without knowing that
 * Spotify is the backing provider.
 */
export function useMusicPlayer() {
  const {
    playback,
    searchTracks,
    playTrack,
    pause,
    resume,
    seek,
    next,
    previous,
  } = useMusicContext();

  return {
    playback,
    searchTracks,
    playTrack,
    pause,
    resume,
    seek,
    next,
    previous,
    toggle: () => (playback.isPlaying ? pause() : resume()),
  };
}
