"use client";

import { Music4, AlertTriangle } from "lucide-react";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { Button } from "@/components/ui/button";

export function ConnectSpotify() {
  const { status, error, connectSpotify, isPremiumRequired } = useSpotifyAuth();

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/30 to-primary/30">
        <Music4 className="h-7 w-7 text-emerald-300" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Listen together</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Connect Spotify to play music right here and share it in real time.
          Both of you need Spotify Premium.
        </p>
      </div>

      {isPremiumRequired && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/15 px-4 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Spotify Premium is required for in-app playback.
        </div>
      )}
      {status === "error" && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={connectSpotify}
        disabled={status === "connecting"}
        className="mt-1"
      >
        {status === "connecting" ? "Connecting…" : "Connect Spotify"}
      </Button>
    </div>
  );
}
