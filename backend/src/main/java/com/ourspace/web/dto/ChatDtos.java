package com.ourspace.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ChatDtos {
    private ChatDtos() {}

    public record SendMessageRequest(
            @NotBlank @Size(max = 4000) String body,
            String clientId
    ) {}
}
