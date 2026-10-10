package com.remembermap.service;

import com.remembermap.api.dto.NoteDTO;
import com.remembermap.model.Modification;
import com.remembermap.model.Note;
import com.remembermap.model.User;
import com.remembermap.repository.ModificationRepository;
import com.remembermap.repository.NoteRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final ModificationRepository modificationRepository;

    public NoteService(NoteRepository noteRepository, ModificationRepository modificationRepository) {
        this.noteRepository = noteRepository;
        this.modificationRepository = modificationRepository;
    }

    @Transactional
    public NoteDTO createNote(Long modificationId, String content, User user) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Note content cannot be empty");
        }

        Modification modification = modificationRepository.findById(modificationId)
                .orElseThrow(() -> new IllegalArgumentException("Modification not found: " + modificationId));

        if (!modification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to add notes to this modification");
        }

        Note note = new Note(content.trim(), modification, user);
        Note saved = noteRepository.save(note);
        return new NoteDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<NoteDTO> getNotesForModification(Long modificationId, User user) {
        return noteRepository.findByModificationIdAndUserIdOrderByCreatedAtDesc(modificationId, user.getId())
                .stream()
                .map(NoteDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteNote(Long modificationId, Long noteId, User user) {
        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Note not found or permission denied"));

        if (!note.getModification().getId().equals(modificationId)) {
            throw new IllegalArgumentException("Note does not belong to modification " + modificationId);
        }

        noteRepository.delete(note);
    }
}
