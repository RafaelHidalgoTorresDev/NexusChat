package com.nexus.backend.controller;

import com.nexus.backend.model.UserProfile;
import com.nexus.backend.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final StorageService storage;

    public UserController(StorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserProfile> getProfile(@PathVariable String username) {
        UserProfile profile = storage.getProfile(username);
        if (profile != null) {
            return ResponseEntity.ok(profile);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{username}")
    public ResponseEntity<UserProfile> updateProfile(@PathVariable String username, @RequestBody UserProfile updatedProfile) {
        UserProfile profile = storage.getProfile(username);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        
        profile.setAvatarUrl(updatedProfile.getAvatarUrl());
        profile.setBio(updatedProfile.getBio());
        profile.setAccentColor(updatedProfile.getAccentColor());
        storage.saveProfile(username, profile);
        
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/{username}/friends/request/{target}")
    public ResponseEntity<UserProfile> sendFriendRequest(@PathVariable String username, @PathVariable String target) {
        UserProfile myProfile = storage.getProfile(username);
        UserProfile targetProfile = storage.getProfile(target);
        if (myProfile == null || targetProfile == null || username.equals(target)) return ResponseEntity.badRequest().build();
        
        myProfile.getOutgoingRequests().add(target);
        targetProfile.getIncomingRequests().add(username);
        
        storage.saveProfile(username, myProfile);
        storage.saveProfile(target, targetProfile);
        return ResponseEntity.ok(myProfile);
    }

    @PostMapping("/{username}/friends/accept/{target}")
    public ResponseEntity<UserProfile> acceptFriendRequest(@PathVariable String username, @PathVariable String target) {
        UserProfile myProfile = storage.getProfile(username);
        UserProfile targetProfile = storage.getProfile(target);
        if (myProfile == null || targetProfile == null) return ResponseEntity.badRequest().build();

        myProfile.getIncomingRequests().remove(target);
        myProfile.getFriends().add(target);
        
        targetProfile.getOutgoingRequests().remove(username);
        targetProfile.getFriends().add(username);

        storage.saveProfile(username, myProfile);
        storage.saveProfile(target, targetProfile);
        return ResponseEntity.ok(myProfile);
    }

    @PostMapping("/{username}/friends/reject/{target}")
    public ResponseEntity<UserProfile> rejectFriendRequest(@PathVariable String username, @PathVariable String target) {
        UserProfile myProfile = storage.getProfile(username);
        UserProfile targetProfile = storage.getProfile(target);
        if (myProfile == null || targetProfile == null) return ResponseEntity.badRequest().build();

        myProfile.getIncomingRequests().remove(target);
        targetProfile.getOutgoingRequests().remove(username);

        storage.saveProfile(username, myProfile);
        storage.saveProfile(target, targetProfile);
        return ResponseEntity.ok(myProfile);
    }

    @DeleteMapping("/{username}/friends/remove/{target}")
    public ResponseEntity<UserProfile> removeFriend(@PathVariable String username, @PathVariable String target) {
        UserProfile myProfile = storage.getProfile(username);
        UserProfile targetProfile = storage.getProfile(target);
        if (myProfile == null || targetProfile == null) return ResponseEntity.badRequest().build();

        myProfile.getFriends().remove(target);
        targetProfile.getFriends().remove(username);

        storage.saveProfile(username, myProfile);
        storage.saveProfile(target, targetProfile);
        return ResponseEntity.ok(myProfile);
    }
}
