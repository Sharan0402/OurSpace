"use client";

import { Radio, RefreshCw, Users } from "lucide-react";
import type { SyncStatus } from "@/types";
import { cn } from "@/lib/utils";

const LABELS: Partial<Record<SyncStatus, string>> = {
  waiting_for_partner: "Waiting for partner…",
  accepted: "Getting ready…",
  countdown: "Starting…",
  synced: "Listening together",
  drift_detected: "Adjusting…",
  resyncing: "Resyncing…",
  declined: "Declined",
  ended: "Session ended",
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  if (status === "idle" || status === "requested") return null;
  const label = LABELS[status] ?? status;
  const active = status === "synced";
  const busy = status === "resyncing" || status === "drift_detected";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        active
          ? "bg-emerald-400/15 text-emerald-300"
          : busy
            ? "bg-amber-400/15 text-amber-300"
            : "bg-white/8 text-muted-foreground",
      )}
    >
      {active ? (
        <Radio className="h-3.5 w-3.5 animate-pulse" />
      ) : busy ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Users className="h-3.5 w-3.5" />
      )}
      {label}
    </div>
  );
}
