"use client";

import { useState } from "react";
import { ChevronDown, Music, Search as SearchIcon, Users, LogOut, Unlink } from "lucide-react";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { useMusicSync } from "@/hooks/useMusicSync";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayerControls } from "./PlayerControls";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { ConnectSpotify } from "./ConnectSpotify";
import { SearchTracks } from "./SearchTracks";
import { artistsToString, formatDuration } from "@/lib/utils";

/** The full-screen (mobile) / full-panel (desktop) music experience. */
export function FullPlayer({ onCollapse }: { onCollapse?: () => void }) {
  const { playback, seek } = useMusicPlayer();
  const { isConnected, disconnectSpotify } = useSpotifyAuth();
  const { status, isSyncing, requestSync, leaveSync } = useMusicSync();
  const [showSearch, setShowSearch] = useState(false);

  const track = playback.track;
  const fraction = playback.durationMs
    ? playback.positionMs / playback.durationMs
    : 0;

  if (!isConnected) {
    return (
      <div className="flex h-full flex-col">
        {onCollapse && <CollapseBar onCollapse={onCollapse} />}
        <div className="flex flex-1 items-center justify-center">
          <ConnectSpotify />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {onCollapse && <CollapseBar onCollapse={onCollapse} />}

      {showSearch ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Find a song</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
              Done
            </Button>
          </div>
          <SearchTracks onSelect={() => setShowSearch(false)} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-6">
          {/* Album art */}
          <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl bg-white/5 shadow-glow">
            {track?.albumArtUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.albumArtUrl}
                alt={track.albumName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Music className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="w-full max-w-sm text-center">
            <SyncStatusBadge status={status} />
            <h2 className="mt-2 truncate text-xl font-semibold">
              {track?.name ?? "Nothing playing"}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {track ? artistsToString(track.artists.map((a) => a.name)) : "Search to start"}
            </p>
          </div>

          {/* Seek */}
          <div className="w-full max-w-sm">
            <Progress
              value={fraction}
              onSeek={(f) => seek(f * playback.durationMs)}
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>{formatDuration(playback.positionMs)}</span>
              <span>{formatDuration(playback.durationMs)}</span>
            </div>
          </div>

          {/* Controls */}
          <PlayerControls size="lg" />

          {/* Actions */}
          <div className="flex w-full max-w-sm items-center justify-center gap-3">
            <Button variant="glass" onClick={() => setShowSearch(true)}>
              <SearchIcon className="h-4 w-4" /> Search
            </Button>
            {isSyncing ? (
              <Button variant="outline" onClick={leaveSync}>
                <LogOut className="h-4 w-4" /> Leave sync
              </Button>
            ) : (
              <Button
                onClick={() => track && requestSync(track.uri)}
                disabled={!track}
              >
                <Users className="h-4 w-4" /> Come Listen With Me
              </Button>
            )}
          </div>

          {/* Disconnect / switch Spotify account */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => void disconnectSpotify()}
          >
            <Unlink className="h-3.5 w-3.5" /> Disconnect Spotify
          </Button>
        </div>
      )}
    </div>
  );
}

function CollapseBar({ onCollapse }: { onCollapse: () => void }) {
  return (
    <div className="safe-top flex items-center justify-between px-4 py-3">
      <Button variant="ghost" size="icon-sm" onClick={onCollapse} aria-label="Close">
        <ChevronDown className="h-5 w-5" />
      </Button>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        Now Playing
      </span>
      <span className="w-9" />
    </div>
  );
}
