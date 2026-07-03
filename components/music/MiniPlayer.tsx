"use client";

import { motion } from "framer-motion";
import { ChevronUp, Music } from "lucide-react";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { useMusicSync } from "@/hooks/useMusicSync";
import { PlayerControls } from "./PlayerControls";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { artistsToString } from "@/lib/utils";

/** Sticky mini player. Tap the artwork/title area to open the full view. */
export function MiniPlayer({ onExpand }: { onExpand: () => void }) {
  const { playback } = useMusicPlayer();
  const { status } = useMusicSync();
  const track = playback.track;

  return (
    <motion.div
      layout
      className="glass-strong mx-2 mb-2 flex items-center gap-3 rounded-2xl p-2"
    >
      <button
        onClick={onExpand}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label="Open full player"
      >
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
          {track?.albumArtUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.albumArtUrl}
              alt={track.albumName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Music className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {track?.name ?? "Nothing playing"}
            </p>
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {track ? artistsToString(track.artists.map((a) => a.name)) : "Tap to open"}
            </p>
            <SyncStatusBadge status={status} />
          </div>
        </div>
      </button>

      <PlayerControls />
    </motion.div>
  );
}
