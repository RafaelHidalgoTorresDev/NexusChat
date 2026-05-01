package com.nexus.backend.controller;

import com.nexus.backend.model.ChatMessage;
import com.nexus.backend.model.MessageType;
import com.nexus.backend.model.UserProfile;
import com.nexus.backend.service.StorageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class ChatController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final StorageService storage;
    
    // Registro de usuarios conectados actualmente (solo en memoria, sesión activa)
    public static final ConcurrentHashMap<String, String> connectedUsers = new ConcurrentHashMap<>();

    public ChatController(SimpMessageSendingOperations messagingTemplate, StorageService storage) {
        this.messagingTemplate = messagingTemplate;
        this.storage = storage;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTime(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        storage.addMessage(chatMessage);
        return chatMessage;
    }

    @MessageMapping("/chat.sendPrivate")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTime(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        messagingTemplate.convertAndSend("/topic/private", chatMessage);
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = chatMessage.getSender();
        String sessionId = headerAccessor.getSessionId();
        
        headerAccessor.getSessionAttributes().put("username", username);
        connectedUsers.put(username, sessionId);
        
        // Notificar a todos
        chatMessage.setTime(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        chatMessage.setContent(username + " se ha unido al chat.");
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
        
        // Enviar lista de usuarios actualizada
        broadcastUserList();
        
        // Enviar historial guardado en disco
        ChatMessage historyMsg = new ChatMessage();
        historyMsg.setType(MessageType.HISTORY);
        historyMsg.setHistory(new ArrayList<>(storage.getMessages()));
        messagingTemplate.convertAndSend("/topic/public", historyMsg);
    }

    public void broadcastUserList() {
        ChatMessage listMsg = new ChatMessage();
        listMsg.setType(MessageType.USER_LIST);
        
        Set<UserProfile> activeProfiles = new HashSet<>();
        for (String user : connectedUsers.keySet()) {
            UserProfile profile = storage.getProfile(user);
            if (profile != null) activeProfiles.add(profile);
        }
        
        listMsg.setConnectedUsers(activeProfiles);
        messagingTemplate.convertAndSend("/topic/public", listMsg);
    }
}
