package com.nexus.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexus.backend.model.ChatMessage;
import com.nexus.backend.model.UserProfile;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String DATA_DIR = "nexus-data";
    private static final String USERS_FILE = DATA_DIR + "/users.json";
    private static final String PROFILES_FILE = DATA_DIR + "/profiles.json";
    private static final String MESSAGES_FILE = DATA_DIR + "/messages.json";

    // Datos en memoria (respaldados por ficheros)
    private Map<String, String> users = new ConcurrentHashMap<>();
    private Map<String, UserProfile> profiles = new ConcurrentHashMap<>();
    private List<ChatMessage> messages = new ArrayList<>();

    @PostConstruct
    public void init() {
        new File(DATA_DIR).mkdirs();
        loadAll();
        log.info("StorageService inicializado. {} usuarios, {} perfiles, {} mensajes cargados.",
                users.size(), profiles.size(), messages.size());
    }

    // --- USUARIOS (credenciales) ---

    public Map<String, String> getUsers() {
        return users;
    }

    public void registerUser(String username, String password) {
        users.put(username, password);
        saveUsers();
    }

    public boolean userExists(String username) {
        return users.containsKey(username);
    }

    public boolean checkPassword(String username, String password) {
        return password.equals(users.get(username));
    }

    // --- PERFILES ---

    public Map<String, UserProfile> getProfiles() {
        return profiles;
    }

    public UserProfile getProfile(String username) {
        return profiles.get(username);
    }

    public void saveProfile(String username, UserProfile profile) {
        profiles.put(username, profile);
        saveProfiles();
    }

    // --- MENSAJES ---

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void addMessage(ChatMessage message) {
        if (messages.size() > 200) messages.remove(0);
        messages.add(message);
        saveMessages();
    }

    // --- Persistencia en disco ---

    private void loadAll() {
        try {
            File uf = new File(USERS_FILE);
            if (uf.exists()) {
                users = mapper.readValue(uf, new TypeReference<ConcurrentHashMap<String, String>>() {});
            }
        } catch (IOException e) {
            log.warn("No se pudo leer users.json: {}", e.getMessage());
        }
        try {
            File pf = new File(PROFILES_FILE);
            if (pf.exists()) {
                profiles = mapper.readValue(pf, new TypeReference<ConcurrentHashMap<String, UserProfile>>() {});
            }
        } catch (IOException e) {
            log.warn("No se pudo leer profiles.json: {}", e.getMessage());
        }
        try {
            File mf = new File(MESSAGES_FILE);
            if (mf.exists()) {
                messages = mapper.readValue(mf, new TypeReference<ArrayList<ChatMessage>>() {});
            }
        } catch (IOException e) {
            log.warn("No se pudo leer messages.json: {}", e.getMessage());
        }
    }

    private void saveUsers() {
        try { mapper.writerWithDefaultPrettyPrinter().writeValue(new File(USERS_FILE), users); }
        catch (IOException e) { log.error("Error guardando users.json: {}", e.getMessage()); }
    }

    private void saveProfiles() {
        try { mapper.writerWithDefaultPrettyPrinter().writeValue(new File(PROFILES_FILE), profiles); }
        catch (IOException e) { log.error("Error guardando profiles.json: {}", e.getMessage()); }
    }

    private void saveMessages() {
        try { mapper.writerWithDefaultPrettyPrinter().writeValue(new File(MESSAGES_FILE), messages); }
        catch (IOException e) { log.error("Error guardando messages.json: {}", e.getMessage()); }
    }
}
