package com.ourspace.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

/** A shared-listening session (stores everything both clients need to sync). */
@DynamoDbBean
public class MusicSyncSession {

    private String sessionId;       // PK
    private String conversationId;
    private String status;          // SyncStatus name

    private String trackUri;
    private String trackName;
    private String artist;
    private String albumArtUrl;

    private String requestedBy;
    private String acceptedBy;

    private Long sharedStartAt;     // epoch millis both clients begin playback
    private Long startPositionMs;   // playback position mapped to sharedStartAt

    private String createdAt;
    private String updatedAt;

    public MusicSyncSession() {}

    @DynamoDbPartitionKey
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTrackUri() { return trackUri; }
    public void setTrackUri(String trackUri) { this.trackUri = trackUri; }

    public String getTrackName() { return trackName; }
    public void setTrackName(String trackName) { this.trackName = trackName; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getAlbumArtUrl() { return albumArtUrl; }
    public void setAlbumArtUrl(String albumArtUrl) { this.albumArtUrl = albumArtUrl; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public String getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(String acceptedBy) { this.acceptedBy = acceptedBy; }

    public Long getSharedStartAt() { return sharedStartAt; }
    public void setSharedStartAt(Long sharedStartAt) { this.sharedStartAt = sharedStartAt; }

    public Long getStartPositionMs() { return startPositionMs; }
    public void setStartPositionMs(Long startPositionMs) { this.startPositionMs = startPositionMs; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
