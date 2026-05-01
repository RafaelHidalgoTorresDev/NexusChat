package com.nexus.backend.model;

public class UserProfile {
    private String username;
    private String avatarUrl;
    private String bio;
    private String accentColor;
    private java.util.Set<String> friends = new java.util.HashSet<>();
    private java.util.Set<String> incomingRequests = new java.util.HashSet<>();
    private java.util.Set<String> outgoingRequests = new java.util.HashSet<>();

    public UserProfile() {}

    public UserProfile(String username, String avatarUrl, String bio, String accentColor) {
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.accentColor = accentColor;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public java.util.Set<String> getFriends() { return friends; }
    public void setFriends(java.util.Set<String> friends) { this.friends = friends; }

    public java.util.Set<String> getIncomingRequests() { return incomingRequests; }
    public void setIncomingRequests(java.util.Set<String> incomingRequests) { this.incomingRequests = incomingRequests; }

    public java.util.Set<String> getOutgoingRequests() { return outgoingRequests; }
    public void setOutgoingRequests(java.util.Set<String> outgoingRequests) { this.outgoingRequests = outgoingRequests; }
}
