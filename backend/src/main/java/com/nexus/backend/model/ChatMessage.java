package com.nexus.backend.model;

import java.util.List;
import java.util.Set;

public class ChatMessage {
    private MessageType type;
    private String content;
    private String sender;
    private String time;
    private String targetUser; // Para mensajes privados
    private Set<UserProfile> connectedUsers; // Para enviar la lista de usuarios con perfiles
    private List<ChatMessage> history; // Para mandar el historial al entrar

    public ChatMessage() {}

    public ChatMessage(MessageType type, String content, String sender, String time) {
        this.type = type;
        this.content = content;
        this.sender = sender;
        this.time = time;
    }

    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getTargetUser() { return targetUser; }
    public void setTargetUser(String targetUser) { this.targetUser = targetUser; }

    public Set<UserProfile> getConnectedUsers() { return connectedUsers; }
    public void setConnectedUsers(Set<UserProfile> connectedUsers) { this.connectedUsers = connectedUsers; }

    public List<ChatMessage> getHistory() { return history; }
    public void setHistory(List<ChatMessage> history) { this.history = history; }
}
