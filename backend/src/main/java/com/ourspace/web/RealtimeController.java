package com.ourspace.web;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * Relays client-published realtime events (typing indicators, sync.tick,
 * client-driven sync.accepted, etc.) to the other partner subscribed on the
 * conversation topic.
 *
 * Persisted events (chat.message, sync session create/patch) go through the
 * REST controllers instead, which persist AND broadcast.
 */
@Controller
public class RealtimeController {

    private final SimpMessagingTemplate messaging;

    public RealtimeController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @MessageMapping("/conversations/{conversationId}/events")
    public void relay(
            @DestinationVariable String conversationId,
            @Payload Map<String, Object> event
    ) {
        messaging.convertAndSend("/topic/conversations/" + conversationId, event);
    }
}
