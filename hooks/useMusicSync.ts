"use client";

import { useMusicContext } from "@/context/MusicProvider";

/**
 * Consent-based shared listening. Drives the sync state machine:
 * idle → requested → waiting_for_partner → accepted → countdown → synced
 *      → (drift_detected → resyncing → synced)* → ended
 */
export function useMusicSync() {
  const {
    syncStatus,
    syncSession,
    incomingRequest,
    countdownValue,
    requestSync,
    acceptSync,
    declineSync,
    leaveSync,
  } = useMusicContext();

  return {
    status: syncStatus,
    session: syncSession,
    incomingRequest,
    countdownValue,
    isSyncing:
      syncStatus === "synced" ||
      syncStatus === "drift_detected" ||
      syncStatus === "resyncing",
    isWaiting: syncStatus === "waiting_for_partner",
    requestSync,
    acceptSync,
    declineSync,
    leaveSync,
  };
}
