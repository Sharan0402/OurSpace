package com.ourspace.web;

import com.ourspace.config.AppProperties;
import com.ourspace.service.CurrentUser;
import com.ourspace.service.SpotifyService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;

/**
 * Spotify OAuth endpoints.
 *
 *  GET /api/spotify/login    → redirect the browser to Spotify's consent screen
 *  GET /api/spotify/callback → Spotify redirects back here with `code`; we
 *                              exchange it server-side and store the encrypted
 *                              refresh token, then bounce back into the app.
 *  GET /api/spotify/token    → (authenticated) mint a short-lived access token
 *                              for the Web Playback SDK / Web API.
 *
 * NOTE on `state`: we pack the Cognito user id + returnTo into the OAuth state
 * so the callback (which has no bearer token) can bind the Spotify account to
 * the right user. In production, SIGN this state (HMAC) or use PKCE + a signed
 * cookie to prevent tampering.
 */
@RestController
@RequestMapping("/api/spotify")
public class SpotifyAuthController {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(SpotifyAuthController.class);

    private final SpotifyService spotify;
    private final AppProperties props;
    private final String stateSecret;

    public SpotifyAuthController(SpotifyService spotify, AppProperties props) {
        this.spotify = spotify;
        this.props = props;
        this.stateSecret = resolveStateSecret(props);
    }

    @GetMapping("/login")
    public void login(
            @RequestParam(required = false, defaultValue = "") String uid,
            @RequestParam(required = false, defaultValue = "") String returnTo,
            HttpServletResponse response
    ) throws IOException {
        String state = encodeState(uid, safeReturnTo(returnTo));
        response.sendRedirect(spotify.authorizeUrl(state));
    }

    @GetMapping("/callback")
    public void callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String state,
            HttpServletResponse response
    ) throws IOException {
        // The state is HMAC-signed; a missing/tampered state is rejected (we must
        // NOT trust an arbitrary userId or returnTo from it).
        String[] decoded = decodeState(state);
        if (decoded == null || decoded[0].isBlank()) {
            log.warn("Spotify callback with missing/invalid state");
            response.sendRedirect(props.frontendOrigin() + "?spotify=error&reason=invalid_state");
            return;
        }
        String userId = decoded[0];
        String returnTo = safeReturnTo(decoded[1]);

        // Spotify redirects here with `?error=...` (no code) when consent fails,
        // e.g. the account isn't on the app's allow-list (Development Mode) or the
        // user cancelled. Surface the real reason instead of a cryptic 400.
        if (code == null || code.isBlank()) {
            String reason = (error == null || error.isBlank()) ? "no_authorization_code" : error;
            log.warn("Spotify link failed for user {}: {}", userId, reason);
            response.sendRedirect(returnTo + "?spotify=error&reason="
                    + URLEncoder.encode(reason, StandardCharsets.UTF_8));
            return;
        }

        try {
            spotify.linkAccount(userId, code);
            response.sendRedirect(returnTo + "?spotify=connected");
        } catch (Exception e) {
            log.warn("Spotify token exchange failed for user {}: {}", userId, e.getMessage());
            response.sendRedirect(returnTo + "?spotify=error&reason="
                    + URLEncoder.encode(e.getMessage() == null ? "unknown" : e.getMessage(),
                    StandardCharsets.UTF_8));
        }
    }

    @GetMapping("/token")
    public Map<String, Object> token() {
        var t = spotify.accessTokenFor(CurrentUser.id());
        return Map.of(
                "accessToken", t.accessToken(),
                "expiresAt", t.expiresAt(),
                "product", t.product() == null ? "unknown" : t.product());
    }

    /** Unlink the caller's Spotify account so they can connect a different one. */
    @DeleteMapping("/token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disconnect() {
        spotify.disconnect(CurrentUser.id());
    }

    // ---- signed state helpers ----

    /** state = base64url(uid|returnTo) + "." + base64url(HMAC-SHA256(payload)). */
    private String encodeState(String uid, String returnTo) {
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString((uid + "|" + returnTo).getBytes(StandardCharsets.UTF_8));
        return payload + "." + sign(payload);
    }

    /** Returns {uid, returnTo}, or null when the state is missing/tampered. */
    private String[] decodeState(String state) {
        if (state == null || state.isBlank()) return null;
        int dot = state.lastIndexOf('.');
        if (dot < 0) return null;
        String payload = state.substring(0, dot);
        String sig = state.substring(dot + 1);
        if (!constantTimeEquals(sign(payload), sig)) return null;
        try {
            String raw = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
            int i = raw.indexOf('|');
            String uid = i < 0 ? raw : raw.substring(0, i);
            String returnTo = i < 0 ? "" : raw.substring(i + 1);
            return new String[]{uid, returnTo};
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** Only allow post-OAuth redirects back to our own frontend (no open redirect). */
    private String safeReturnTo(String returnTo) {
        String origin = props.frontendOrigin();
        if (returnTo != null && !returnTo.isBlank() && origin != null && returnTo.startsWith(origin)) {
            return returnTo;
        }
        return origin;
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(stateSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] h = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(h);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign OAuth state", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static String resolveStateSecret(AppProperties props) {
        if (props.auth() != null && props.auth().jwtSecret() != null
                && !props.auth().jwtSecret().isBlank()) {
            return props.auth().jwtSecret();
        }
        if (props.crypto() != null && props.crypto().key() != null
                && !props.crypto().key().isBlank()) {
            return props.crypto().key();
        }
        return "our-space-dev-state-secret-change-me";
    }
}
