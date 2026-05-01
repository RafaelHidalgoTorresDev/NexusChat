package com.nexus.backend.controller;

import com.nexus.backend.model.AuthRequest;
import com.nexus.backend.model.AuthResponse;
import com.nexus.backend.model.UserProfile;
import com.nexus.backend.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final StorageService storage;

    public AuthController(StorageService storage) {
        this.storage = storage;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        String username = request.getUsername().trim();
        String password = request.getPassword();

        if (username.isEmpty() || password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(
                new AuthResponse(false, "Usuario y contraseña obligatorios.", null)
            );
        }

        if (storage.userExists(username)) {
            return ResponseEntity.badRequest().body(
                new AuthResponse(false, "El nombre de usuario ya está en uso.", null)
            );
        }

        storage.registerUser(username, password);
        storage.saveProfile(username, new UserProfile(
            username, "", "¡Hola! Estoy usando NexusChat.", "#7289da"
        ));

        return ResponseEntity.ok(new AuthResponse(true, "Cuenta creada con éxito.", username));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        String username = request.getUsername().trim();
        String password = request.getPassword();

        if (!storage.userExists(username)) {
            return ResponseEntity.status(401).body(
                new AuthResponse(false, "El usuario no existe.", null)
            );
        }

        if (!storage.checkPassword(username, password)) {
            return ResponseEntity.status(401).body(
                new AuthResponse(false, "Contraseña incorrecta.", null)
            );
        }

        return ResponseEntity.ok(new AuthResponse(true, "Login correcto.", username));
    }
}
