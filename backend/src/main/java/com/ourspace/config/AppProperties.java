package com.ourspace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Strongly-typed application configuration bound from `app.*` in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String persistence,
        List<String> authorizedUserIds,
        String frontendOrigin,
        Auth auth,
        Cognito cognito,
        Crypto crypto,
        Dynamo dynamo,
        Spotify spotify
) {
    /**
     * Simple built-in auth for a tiny (two-person) private deployment: each user
     * has a username + password; on login we issue an HS256 JWT signed with
     * {@code jwtSecret}. Enabled only when a secret and at least one user exist.
     */
    public record Auth(String jwtSecret, List<User> users) {
        public boolean enabled() {
            return jwtSecret != null && !jwtSecret.isBlank()
                    && users != null && !users.isEmpty();
        }

        public record User(String id, String displayName, String username, String password) {}
    }

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
