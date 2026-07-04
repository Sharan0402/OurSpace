package com.ourspace.config;

import com.ourspace.service.JwtService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Component;

/**
 * Authenticates the STOMP WebSocket. On CONNECT we require a valid session token
 * in the Authorization header and bind the user as the session Principal;
 * unauthenticated connects are rejected. Without this, the chat topic would be
 * world-readable. No-op when built-in auth is disabled (open local dev).
 */
@Component
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwt;

    public AuthChannelInterceptor(JwtService jwt) {
        this.jwt = jwt;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }
        if (!jwt.enabled()) {
            return message; // open local dev — no auth configured
        }
        String header = accessor.getFirstNativeHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ")
                ? header.substring(7)
                : null;
        JwtService.Principal principal = jwt.verify(token).orElseThrow(
                () -> new MessagingException("Unauthorized WebSocket connection"));
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                principal.userId(), null, AuthorityUtils.NO_AUTHORITIES));
        return message;
    }
}
