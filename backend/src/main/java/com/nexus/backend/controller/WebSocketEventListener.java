package com.nexus.backend.controller;

import com.nexus.backend.model.ChatMessage;
import com.nexus.backend.model.MessageType;
import com.nexus.backend.model.UserProfile;
import com.nexus.backend.service.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;

@Component
public class WebSocketEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final SimpMessageSendingOperations messagingTemplate;
    private final StorageService storage;

    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate, StorageService storage) {
        this.messagingTemplate = messagingTemplate;
        this.storage = storage;
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");

        if (username != null) {
            log.info("User disconnected: {}", username);
            
            ChatController.connectedUsers.remove(username);

            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(MessageType.LEAVE);
            chatMessage.setSender(username);
            chatMessage.setContent(username + " ha abandonado el chat.");
            chatMessage.setTime(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
            
            // Broadcast updated user list
            ChatMessage listMsg = new ChatMessage();
            listMsg.setType(MessageType.USER_LIST);
            Set<UserProfile> activeProfiles = new HashSet<>();
            for (String user : ChatController.connectedUsers.keySet()) {
                UserProfile profile = storage.getProfile(user);
                if (profile != null) activeProfiles.add(profile);
            }
            listMsg.setConnectedUsers(activeProfiles);
            messagingTemplate.convertAndSend("/topic/public", listMsg);
        }
    }
}
