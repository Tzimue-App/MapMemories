package com.remembermap.api;

import com.remembermap.api.dto.CreateModificationRequest;
import com.remembermap.api.dto.ModificationDTO;
import com.remembermap.service.ModificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modifications")
public class ModificationController {

    private final ModificationService modificationService;

    public ModificationController(ModificationService modificationService) {
        this.modificationService = modificationService;
    }

    @PostMapping
    public ResponseEntity<ModificationDTO> createModification(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateModificationRequest request) {
        ModificationDTO created = modificationService.createModification(userDetails.getUsername(), request);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<ModificationDTO>> getModifications(@AuthenticationPrincipal UserDetails userDetails) {
        List<ModificationDTO> modifications = modificationService.getUserModifications(userDetails.getUsername());
        return ResponseEntity.ok(modifications);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteModification(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        boolean deleted = modificationService.deleteModification(userDetails.getUsername(), id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
