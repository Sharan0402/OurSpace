package com.ourspace.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Enforces "only two authorized users". Even with a valid Cognito token, the
 * caller's `sub` must be in the configured allow-list. If the list is empty
 * (local dev), the filter is permissive.
 */
@Component
public class AuthorizedUserFilter extends OncePerRequestFilter {

    private final List<String> allowed;

    public AuthorizedUserFilter(AppProperties props) {
        this.allowed = props.authorizedUserIds() == null ? List.of() : props.authorizedUserIds();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/spotify/login")
                || path.startsWith("/api/spotify/callback")
                || path.startsWith("/ws")
                || path.equals("/health");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {
        if (!allowed.isEmpty()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                if (!allowed.contains(jwt.getSubject())) {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN,
                            "This account is not authorized for Our Space.");
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }
}
