package com.ourspace.web;

import com.ourspace.config.AppProperties;
import com.ourspace.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/**
 * Built-in two-person login. Verifies a username/password against the configured
 * users and returns a signed session token. Constant-time password comparison.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppProperties props;
    private final JwtService jwt;

    public AuthController(AppProperties props, JwtService jwt) {
        this.props = props;
        this.jwt = jwt;
    }

    public record LoginRequest(String username, String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) LoginRequest req) {
        AppProperties.Auth auth = props.auth();
        if (auth == null || !auth.enabled() || req == null
                || req.username() == null || req.password() == null) {
            return unauthorized();
        }
        for (AppProperties.Auth.User u : auth.users()) {
            if (u.username() != null
                    && u.username().equalsIgnoreCase(req.username().trim())
                    && u.password() != null && !u.password().isBlank()
                    && constantTimeEquals(u.password(), req.password())) {
                JwtService.TokenResult t = jwt.issue(u.id(), u.displayName());
                return ResponseEntity.ok(Map.of(
                        "idToken", t.token(),
                        "userId", u.id(),
                        "displayName", u.displayName(),
                        "expiresAt", t.expiresAt()));
            }
        }
        return unauthorized();
    }

    private static ResponseEntity<Map<String, Object>> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
