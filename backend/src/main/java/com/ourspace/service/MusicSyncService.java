package com.ourspace.service;

import com.ourspace.model.MusicSyncSession;
import com.ourspace.model.SyncStatus;
import com.ourspace.repository.SyncRepository;
import com.ourspace.web.dto.SyncDtos.CreateSyncRequest;
import com.ourspace.web.dto.SyncDtos.PatchSyncRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Owns the server side of consent-based shared listening. Persists the session
 * to DynamoDB and fans the corresponding realtime events to both partners.
 */
@Service
public class MusicSyncService {

    private final SyncRepository repo;
    private final RealtimeEventPublisher realtime;

    public MusicSyncService(SyncRepository repo, RealtimeEventPublisher realtime) {
        this.repo = repo;
        this.realtime = realtime;
    }

    public MusicSyncSession create(String requestedBy, CreateSyncRequest req) {
        String now = Instant.now().toString();
        MusicSyncSession s = new MusicSyncSession();
        s.setSessionId(UUID.randomUUID().toString());
        s.setConversationId(req.conversationId());
        s.setStatus(SyncStatus.requested.name());
        s.setTrackUri(req.trackUri());
        s.setTrackName(req.trackName());
        s.setArtist(req.artist());
        s.setAlbumArtUrl(req.albumArtUrl());
        s.setRequestedBy(requestedBy);
        s.setStartPositionMs(req.startPositionMs() == null ? 0L : req.startPositionMs());
        s.setCreatedAt(now);
        s.setUpdatedAt(now);

        repo.save(s);
        realtime.publish(s.getConversationId(),
                RealtimeEventPublisher.event("sync.requested", Map.of("session", s)));
        return s;
    }

    public MusicSyncSession patch(String sessionId, String actingUserId, PatchSyncRequest patch) {
        MusicSyncSession s = repo.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Sync session not found"));

        if (patch.status() != null) s.setStatus(patch.status().name());
        if (patch.acceptedBy() != null) s.setAcceptedBy(patch.acceptedBy());
        if (patch.sharedStartAt() != null) s.setSharedStartAt(patch.sharedStartAt());
        s.setUpdatedAt(Instant.now().toString());
        repo.save(s);

        String eventType = switch (SyncStatus.valueOf(s.getStatus())) {
            case accepted -> "sync.accepted";
            case declined -> "sync.declined";
            case ended -> "sync.ended";
            default -> "sync.updated";
        };
        realtime.publish(s.getConversationId(),
                RealtimeEventPublisher.event(eventType, Map.of("session", s)));
        return s;
    }
}
