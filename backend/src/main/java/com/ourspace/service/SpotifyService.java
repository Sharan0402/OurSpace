package com.ourspace.service;

import com.ourspace.config.AppProperties;
import com.ourspace.model.SpotifyTokenRecord;
import com.ourspace.repository.SpotifyTokenRepository;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * All server-side Spotify OAuth. The client secret lives ONLY here and is used
 * to exchange the authorization code and to refresh access tokens. The refresh
 * token is encrypted before it touches the database; access tokens are minted
 * on demand and never persisted.
 */
@Service
public class SpotifyService {

    private static final String TOKEN_URL = "https://accounts.spotify.com/api/token";
    private static final String AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
    private static final String ME_URL = "https://api.spotify.com/v1/me";

    private final AppProperties props;
    private final SpotifyTokenRepository tokens;
    private final TokenCipher cipher;
    private final RestClient http = RestClient.create();

    public SpotifyService(AppProperties props, SpotifyTokenRepository tokens, TokenCipher cipher) {
        this.props = props;
        this.tokens = tokens;
        this.cipher = cipher;
    }

    public String authorizeUrl(String state) {
        var sp = props.spotify();
        return AUTHORIZE_URL
                + "?response_type=code"
                + "&client_id=" + enc(sp.clientId())
                + "&scope=" + enc(sp.scopes())
                + "&redirect_uri=" + enc(sp.redirectUri())
                // Always show the consent/account screen so a user can switch to a
                // different Spotify account instead of Spotify silently re-linking
                // the one already signed in at accounts.spotify.com.
                + "&show_dialog=true"
                + "&state=" + enc(state);
    }

    /** Exchange the auth code, fetch the profile, and persist the encrypted refresh token. */
    public SpotifyTokenRecord linkAccount(String userId, String code) {
        Map<?, ?> token = http.post()
                .uri(TOKEN_URL)
                .header("Authorization", basicAuth())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form(Map.of(
                        "grant_type", "authorization_code",
                        "code", code,
                        "redirect_uri", props.spotify().redirectUri())))
                .retrieve()
                .body(Map.class);

        String accessToken = str(token, "access_token");
        String refreshToken = str(token, "refresh_token");

        Map<?, ?> me = http.get()
                .uri(ME_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);

        SpotifyTokenRecord record = new SpotifyTokenRecord();
        record.setUserId(userId);
        record.setEncryptedRefreshToken(cipher.encrypt(refreshToken));
        record.setSpotifyUserId(str(me, "id"));
        record.setProduct(str(me, "product"));
        record.setUpdatedAt(Instant.now().toString());
        return tokens.save(record);
    }

    /** Forget the stored Spotify link for a user so they can connect afresh. */
    public void disconnect(String userId) {
        tokens.deleteByUserId(userId);
    }

    public record AccessToken(String accessToken, long expiresAt, String product) {}

    /** Mint a fresh short-lived access token for the Web Playback SDK / Web API. */
    public AccessToken accessTokenFor(String userId) {
        SpotifyTokenRecord record = tokens.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Spotify not linked"));
        String refreshToken = cipher.decrypt(record.getEncryptedRefreshToken());

        Map<?, ?> token = http.post()
                .uri(TOKEN_URL)
                .header("Authorization", basicAuth())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form(Map.of(
                        "grant_type", "refresh_token",
                        "refresh_token", refreshToken)))
                .retrieve()
                .body(Map.class);

        String accessToken = str(token, "access_token");
        long expiresIn = token.get("expires_in") instanceof Number n ? n.longValue() : 3600L;

        // Spotify may issue a rotated refresh token; persist it if present.
        String rotated = str(token, "refresh_token");
        if (rotated != null && !rotated.isBlank()) {
            record.setEncryptedRefreshToken(cipher.encrypt(rotated));
            record.setUpdatedAt(Instant.now().toString());
            tokens.save(record);
        }

        return new AccessToken(accessToken,
                Instant.now().toEpochMilli() + expiresIn * 1000, record.getProduct());
    }

    // ---- helpers ----

    private String basicAuth() {
        String creds = props.spotify().clientId() + ":" + props.spotify().clientSecret();
        return "Basic " + Base64.getEncoder()
                .encodeToString(creds.getBytes(StandardCharsets.UTF_8));
    }

    private static MultiValueMap<String, String> form(Map<String, String> fields) {
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        fields.forEach(map::add);
        return map;
    }

    private static String enc(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }

    private static String str(Map<?, ?> map, String key) {
        Object v = map == null ? null : map.get(key);
        return v == null ? null : v.toString();
    }
}
