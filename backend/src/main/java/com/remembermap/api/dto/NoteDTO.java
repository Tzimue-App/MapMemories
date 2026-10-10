package com.remembermap.api.dto;

import com.remembermap.model.Note;

import java.time.LocalDateTime;

public class NoteDTO {
    private Long id;
    private Long modificationId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NoteDTO() {
    }

    public NoteDTO(Note note) {
        this.id = note.getId();
        this.modificationId = note.getModification() != null ? note.getModification().getId() : null;
        this.content = note.getContent();
        this.createdAt = note.getCreatedAt();
        this.updatedAt = note.getUpdatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getModificationId() {
        return modificationId;
    }

    public void setModificationId(Long modificationId) {
        this.modificationId = modificationId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
