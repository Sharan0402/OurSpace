"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0..1
  className?: string;
  onSeek?: (fraction: number) => void;
}

/** Interactive progress/seek bar. Tap or drag to seek. */
export function Progress({ value, className, onSeek }: ProgressProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const clamped = Math.min(1, Math.max(0, value));

  const handle = (clientX: number) => {
    const el = ref.current;
    if (!el || !onSeek) return;
    const rect = el.getBoundingClientRect();
    const fraction = (clientX - rect.left) / rect.width;
    onSeek(Math.min(1, Math.max(0, fraction)));
  };

  return (
    <div
      ref={ref}
      className={cn(
        "group relative h-1.5 w-full cursor-pointer rounded-full bg-white/10",
        className,
      )}
      onClick={(e) => handle(e.clientX)}
      role={onSeek ? "slider" : "progressbar"}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
        style={{ width: `${clamped * 100}%` }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover:opacity-100"
        style={{ left: `${clamped * 100}%` }}
      />
    </div>
  );
}
