package com.ourspace.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

/** Helper to read the authenticated Cognito user id (`sub`) from the context. */
public final class CurrentUser {

    private CurrentUser() {}

    public static String id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        // In local dev with security effectively open, fall back to a stable id.
        return "user_you";
    }
}
