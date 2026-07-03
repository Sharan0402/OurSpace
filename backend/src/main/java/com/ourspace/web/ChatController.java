package com.ourspace.web;

import com.ourspace.model.ChatMessage;
import com.ourspace.service.ChatService;
import com.ourspace.service.CurrentUser;
import com.ourspace.web.dto.ChatDtos.SendMessageRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations/{conversationId}/messages")
public class ChatController {

    private final ChatService chat;

    public ChatController(ChatService chat) {
        this.chat = chat;
    }

    @GetMapping
    public List<ChatMessage> history(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return chat.history(conversationId, Math.min(limit, 200));
    }

    @PostMapping
    public ChatMessage send(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest req
    ) {
        return chat.send(conversationId, CurrentUser.id(), req.body(), req.clientId());
    }
}
