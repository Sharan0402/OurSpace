package com.ourspace.web;

import com.ourspace.config.AppProperties;
import com.ourspace.service.CurrentUser;
import com.ourspace.service.SpotifyService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

    private final SpotifyService spotify;
    private final AppProperties props;

    public SpotifyAuthController(SpotifyService spotify, AppProperties props) {
        this.spotify = spotify;
        this.props = props;
    }

    @GetMapping("/login")
    public void login(
            @RequestParam(required = false, defaultValue = "") String uid,
            @RequestParam(required = false, defaultValue = "") String returnTo,
            HttpServletResponse response
    ) throws IOException {
        String state = encodeState(uid, returnTo.isBlank() ? props.frontendOrigin() : returnTo);
        response.sendRedirect(spotify.authorizeUrl(state));
    }

    @GetMapping("/callback")
    public void callback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            HttpServletResponse response
    ) throws IOException {
        String[] decoded = decodeState(state);
        String userId = decoded[0].isBlank() ? CurrentUser.id() : decoded[0];
        String returnTo = decoded[1].isBlank() ? props.frontendOrigin() : decoded[1];

        try {
            spotify.linkAccount(userId, code);
            response.sendRedirect(returnTo + "?spotify=connected");
        } catch (Exception e) {
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

    // ---- state helpers ----

    private static String encodeState(String uid, String returnTo) {
        String raw = uid + "|" + returnTo;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private static String[] decodeState(String state) {
        if (state == null || state.isBlank()) return new String[]{"", ""};
        try {
            String raw = new String(Base64.getUrlDecoder().decode(state), StandardCharsets.UTF_8);
            int i = raw.indexOf('|');
            if (i < 0) return new String[]{raw, ""};
            return new String[]{raw.substring(0, i), raw.substring(i + 1)};
        } catch (IllegalArgumentException e) {
            return new String[]{"", ""};
        }
    }
}
