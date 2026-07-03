import type { MusicSyncSession, SyncStatus } from "@/types";
import { apiFetch } from "./client";

/**
 * Music-sync session REST calls against the Java backend.
 * The backend persists the session in DynamoDB and fans events out over the
 * realtime channel; these calls just trigger those server actions.
 */

export function createSyncSession(
  session: MusicSyncSession,
): Promise<MusicSyncSession> {
  return apiFetch<MusicSyncSession>("/api/sync/sessions", {
    method: "POST",
    body: session,
  });
}

export function patchSyncSession(
  sessionId: string,
  patch: Partial<{
    status: SyncStatus;
    acceptedBy: string;
    sharedStartAt: number;
  }>,
): Promise<MusicSyncSession> {
  return apiFetch<MusicSyncSession>(`/api/sync/sessions/${sessionId}`, {
    method: "PATCH",
    body: patch,
  });
}
