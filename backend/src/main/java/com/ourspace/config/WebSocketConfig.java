package com.ourspace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP-over-WebSocket for realtime chat + music-sync.
 *
 *   Client subscribes:  /topic/conversations/{conversationId}
 *   Client publishes:   /app/conversations/{conversationId}/events
 *   Server broadcasts:  via SimpMessagingTemplate to the /topic destination
 *
 * Endpoint: ws://host/ws  (SockJS fallback also enabled at /ws)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AppProperties props;

    public WebSocketConfig(AppProperties props) {
        this.props = props;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(props.frontendOrigin());
        registry.addEndpoint("/ws")
                .setAllowedOrigins(props.frontendOrigin())
                .withSockJS();
    }
}
