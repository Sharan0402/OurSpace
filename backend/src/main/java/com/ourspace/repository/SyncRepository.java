package com.ourspace.repository;

import com.ourspace.model.MusicSyncSession;

import java.util.Optional;

public interface SyncRepository {
    MusicSyncSession save(MusicSyncSession session);
    Optional<MusicSyncSession> findById(String sessionId);
}
