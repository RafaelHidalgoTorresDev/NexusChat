package com.nexus.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private static final String UPLOAD_DIR = "nexus-data/uploads/";

    public MediaController() {
        new File(UPLOAD_DIR).mkdirs();
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Archivo vacío"));
        }

        try {
            String ext = "";
            String orig = file.getOriginalFilename();
            if (orig != null && orig.contains(".")) {
                ext = orig.substring(orig.lastIndexOf("."));
            } else {
                // Inferir extensión del content type
                String ct = file.getContentType();
                if (ct != null) {
                    if (ct.contains("jpeg") || ct.contains("jpg")) ext = ".jpg";
                    else if (ct.contains("png")) ext = ".png";
                    else if (ct.contains("gif")) ext = ".gif";
                    else if (ct.contains("webm")) ext = ".webm";
                    else if (ct.contains("ogg")) ext = ".ogg";
                    else if (ct.contains("mp4")) ext = ".mp4";
                    else ext = ".bin";
                }
            }

            String filename = UUID.randomUUID().toString() + ext;
            Path path = Paths.get(UPLOAD_DIR + filename);
            Files.write(path, file.getBytes());

            return ResponseEntity.ok(Map.of("filename", filename));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al guardar"));
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<byte[]> getFile(@PathVariable String filename) {
        try {
            Path path = Paths.get(UPLOAD_DIR + filename);
            if (!Files.exists(path)) return ResponseEntity.notFound().build();

            byte[] data = Files.readAllBytes(path);
            String contentType = Files.probeContentType(path);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Access-Control-Allow-Origin", "*")
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
