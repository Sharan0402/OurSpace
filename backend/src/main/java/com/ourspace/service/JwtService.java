package com.ourspace.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.ourspace.config.AppProperties;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

/**
 * Issues and verifies HS256 session tokens for the built-in two-person auth.
 * The signing secret comes from APP_JWT_SECRET (>= 32 bytes). Disabled (no-op)
 * when no secret is configured, so local dev stays open.
 */
@Service
public class JwtService {

    private static final long TTL_DAYS = 30;

    private final byte[] secret;
    private final boolean enabled;

    public JwtService(AppProperties props) {
        String s = props.auth() == null ? null : props.auth().jwtSecret();
        this.enabled = s != null && !s.isBlank();
        byte[] bytes = enabled ? s.getBytes(StandardCharsets.UTF_8) : new byte[0];
        if (enabled && bytes.length < 32) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET must be at least 32 bytes for HS256. Generate one with: openssl rand -base64 48");
        }
        this.secret = bytes;
    }

    public boolean enabled() {
        return enabled;
    }

    public record Principal(String userId, String displayName) {}

    public record TokenResult(String token, long expiresAt) {}

    /** Sign a token for a user; expiresAt is epoch millis. */
    public TokenResult issue(String userId, String displayName) {
        try {
            Instant exp = Instant.now().plus(TTL_DAYS, ChronoUnit.DAYS);
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(userId)
                    .claim("name", displayName)
                    .issueTime(new Date())
                    .expirationTime(Date.from(exp))
                    .build();
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(secret));
            return new TokenResult(jwt.serialize(), exp.toEpochMilli());
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to sign session token", e);
        }
    }

    /** Verify signature + expiry; returns the principal when valid. */
    public Optional<Principal> verify(String token) {
        if (!enabled || token == null || token.isBlank()) return Optional.empty();
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(secret))) return Optional.empty();
            Date exp = jwt.getJWTClaimsSet().getExpirationTime();
            if (exp == null || exp.before(new Date())) return Optional.empty();
            String userId = jwt.getJWTClaimsSet().getSubject();
            if (userId == null || userId.isBlank()) return Optional.empty();
            String name = jwt.getJWTClaimsSet().getStringClaim("name");
            return Optional.of(new Principal(userId, name));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
