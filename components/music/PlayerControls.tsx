"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlayerControls({ size = "md" }: { size?: "md" | "lg" }) {
  const { playback, toggle, next, previous } = useMusicPlayer();
  const big = size === "lg";

  return (
    <div className={cn("flex items-center", big ? "gap-6" : "gap-2")}>
      <Button
        variant="ghost"
        size={big ? "icon" : "icon-sm"}
        onClick={() => previous()}
        aria-label="Previous"
      >
        <SkipBack className={big ? "h-6 w-6" : "h-4 w-4"} />
      </Button>
      <Button
        size={big ? "icon-lg" : "icon"}
        onClick={() => toggle()}
        aria-label={playback.isPlaying ? "Pause" : "Play"}
      >
        {playback.isPlaying ? (
          <Pause className={big ? "h-7 w-7 fill-current" : "h-5 w-5 fill-current"} />
        ) : (
          <Play className={big ? "h-7 w-7 fill-current" : "h-5 w-5 fill-current"} />
        )}
      </Button>
      <Button
        variant="ghost"
        size={big ? "icon" : "icon-sm"}
        onClick={() => next()}
        aria-label="Next"
      >
        <SkipForward className={big ? "h-6 w-6" : "h-4 w-4"} />
      </Button>
    </div>
  );
}
