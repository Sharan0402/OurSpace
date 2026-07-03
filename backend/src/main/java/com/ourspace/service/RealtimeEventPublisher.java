package com.ourspace.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Fans realtime events out to both partners over STOMP. The payload shape
 * matches the frontend `RealtimeEvent` union so clients can switch on `type`.
 */
@Service
public class RealtimeEventPublisher {

    private final SimpMessagingTemplate messaging;

    public RealtimeEventPublisher(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    public void publish(String conversationId, Object event) {
        messaging.convertAndSend("/topic/conversations/" + conversationId, event);
    }

    /** Convenience for building a typed event map. */
    public static Map<String, Object> event(String type, Map<String, Object> fields) {
        var map = new java.util.HashMap<String, Object>();
        map.put("type", type);
        map.putAll(fields);
        return map;
    }
}
