package com.ourspace.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Helper to read the authenticated Cognito user id (`sub`) from the context. */
public final class CurrentUser {

    private CurrentUser() {}

    public static String id() {
        // Production / Cognito-enabled path: trust ONLY the verified JWT subject.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        // Local-dev path (Cognito disabled): honor the X-Dev-User header so two
        // browsers can act as distinct users. Never reachable once a JWT is
        // required, so this cannot be used to spoof identity in production.
        if (RequestContextHolder.getRequestAttributes()
                instanceof ServletRequestAttributes attrs) {
            String devUser = attrs.getRequest().getHeader("X-Dev-User");
            if (devUser != null && !devUser.isBlank()) {
                return devUser;
            }
        }
        return "user_you";
    }
}
