package com.ourspace.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

/**
 * Per-user Spotify credential record.
 *
 * SECURITY: only the refresh token is stored, and it is ENCRYPTED (AES-GCM)
 * before persistence. Access tokens are short-lived and minted on demand, never
 * stored. The Spotify client secret is never stored here or sent to the client.
 */
@DynamoDbBean
public class SpotifyTokenRecord {

    private String userId;                 // PK (Cognito sub)
    private String encryptedRefreshToken;  // AES-GCM ciphertext (base64)
    private String spotifyUserId;
    private String product;                // premium | free
    private String updatedAt;

    public SpotifyTokenRecord() {}

    @DynamoDbPartitionKey
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEncryptedRefreshToken() { return encryptedRefreshToken; }
    public void setEncryptedRefreshToken(String encryptedRefreshToken) {
        this.encryptedRefreshToken = encryptedRefreshToken;
    }

    public String getSpotifyUserId() { return spotifyUserId; }
    public void setSpotifyUserId(String spotifyUserId) { this.spotifyUserId = spotifyUserId; }

    public String getProduct() { return product; }
    public void setProduct(String product) { this.product = product; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
