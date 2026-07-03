package com.ourspace.web.dto;

import com.ourspace.model.SyncStatus;
import jakarta.validation.constraints.NotBlank;

public final class SyncDtos {
    private SyncDtos() {}

    public record CreateSyncRequest(
            @NotBlank String conversationId,
            @NotBlank String trackUri,
            String trackName,
            String artist,
            String albumArtUrl,
            Long startPositionMs
    ) {}

    public record PatchSyncRequest(
            SyncStatus status,
            String acceptedBy,
            Long sharedStartAt
    ) {}
}
