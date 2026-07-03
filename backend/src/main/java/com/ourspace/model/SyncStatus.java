package com.ourspace.model;

/** Music-sync state machine values (mirrors the frontend SyncStatus union). */
public enum SyncStatus {
    idle,
    requested,
    waiting_for_partner,
    accepted,
    countdown,
    synced,
    drift_detected,
    resyncing,
    declined,
    ended
}
