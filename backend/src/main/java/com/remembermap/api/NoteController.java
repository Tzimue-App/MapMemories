package com.remembermap.api;

import com.remembermap.api.dto.NoteDTO;
import com.remembermap.model.User;
import com.remembermap.service.CustomUserDetailsService;
import com.remembermap.service.NoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/modifications/{modificationId}/notes")
public class NoteController {

    private final NoteService noteService;
    private final CustomUserDetailsService userDetailsService;

    public NoteController(NoteService noteService, CustomUserDetailsService userDetailsService) {
        this.noteService = noteService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping
    public ResponseEntity<NoteDTO> createNote(
            @PathVariable Long modificationId,
            @RequestBody Map<String, String> requestBody,
            @AuthenticationPrincipal UserDetails userDetails) {

        String content = requestBody.get("content");
        User currentUser = userDetailsService.loadUserEntityByUsername(userDetails.getUsername());
        NoteDTO dto = noteService.createNote(modificationId, content, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public ResponseEntity<List<NoteDTO>> getNotes(
            @PathVariable Long modificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userDetailsService.loadUserEntityByUsername(userDetails.getUsername());
        List<NoteDTO> notes = noteService.getNotesForModification(modificationId, currentUser);
        return ResponseEntity.ok(notes);
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long modificationId,
            @PathVariable Long noteId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userDetailsService.loadUserEntityByUsername(userDetails.getUsername());
        noteService.deleteNote(modificationId, noteId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
