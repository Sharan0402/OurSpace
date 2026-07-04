package com.ourspace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Strongly-typed application configuration bound from `app.*` in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String persistence,
        List<String> authorizedUserIds,
        String frontendOrigin,
        Cognito cognito,
        Crypto crypto,
        Dynamo dynamo,
        Spotify spotify
) {
    public record Cognito(String region, String userPoolId) {
        /** OIDC issuer URI, or null when Cognito isn't configured (dev). */
        public String issuerUri() {
            if (userPoolId == null || userPoolId.isBlank()) return null;
            return "https://cognito-idp." + region + ".amazonaws.com/" + userPoolId;
        }
    }

    public record Crypto(String key) {}

    public record Dynamo(String region, String endpoint, Tables tables) {
        public record Tables(
                String messages,
                String conversations,
                String spotifyTokens,
                String syncSessions
        ) {}
    }

    public record Spotify(
            String clientId,
            String clientSecret,
            String redirectUri,
            String scopes
    ) {}
}
