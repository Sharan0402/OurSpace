package com.ourspace.web;

import com.ourspace.model.MusicSyncSession;
import com.ourspace.service.CurrentUser;
import com.ourspace.service.MusicSyncService;
import com.ourspace.web.dto.SyncDtos.CreateSyncRequest;
import com.ourspace.web.dto.SyncDtos.PatchSyncRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Music-sync REST surface. The frontend calls these to create/accept/decline/
 * end sessions; the service persists to DynamoDB and broadcasts realtime events
 * to both partners.
 */
@RestController
@RequestMapping("/api/sync/sessions")
public class MusicSyncController {

    private final MusicSyncService sync;

    public MusicSyncController(MusicSyncService sync) {
        this.sync = sync;
    }

    @PostMapping
    public MusicSyncSession create(@Valid @RequestBody CreateSyncRequest req) {
        return sync.create(CurrentUser.id(), req);
    }

    @PatchMapping("/{sessionId}")
    public MusicSyncSession patch(
            @PathVariable String sessionId,
            @RequestBody PatchSyncRequest patch
    ) {
        return sync.patch(sessionId, CurrentUser.id(), patch);
    }
}
