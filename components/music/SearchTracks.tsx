"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Play } from "lucide-react";
import type { Track } from "@/types";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { artistsToString } from "@/lib/utils";

export function SearchTracks({
  onSelect,
}: {
  onSelect?: (track: Track) => void;
}) {
  const { searchTracks, playTrack } = useMusicPlayer();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        setResults(await searchTracks(query));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, searchTracks]);

  const handleSelect = (track: Track) => {
    onSelect?.(track);
    void playTrack(track.uri, 0);
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a song…"
          className="pl-10"
          inputMode="search"
        />
      </div>

      <div className="chat-scroll min-h-0 flex-1 space-y-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Spinner /> Searching…
          </div>
        )}
        {!loading &&
          results.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelect(track)}
              className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-white/5"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
                {track.albumArtUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.albumArtUrl}
                    alt={track.albumName}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-4 w-4 fill-white text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{track.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {artistsToString(track.artists.map((a) => a.name))}
                </p>
              </div>
            </button>
          ))}
        {!loading && query && results.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            No songs found for “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}
