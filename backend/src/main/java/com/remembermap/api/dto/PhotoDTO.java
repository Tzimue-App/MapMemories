package com.remembermap.api.dto;

import com.remembermap.model.Photo;

import java.time.LocalDateTime;

public class PhotoDTO {
    private Long id;
    private Long modificationId;
    private String originalFilename;
    private String contentType;
    private Long size;
    private String caption;
    private String contentUrl;
    private LocalDateTime createdAt;

    public PhotoDTO() {
    }

    public PhotoDTO(Photo photo) {
        this.id = photo.getId();
        this.modificationId = photo.getModification() != null ? photo.getModification().getId() : null;
        this.originalFilename = photo.getOriginalFilename();
        this.contentType = photo.getContentType();
        this.size = photo.getSize();
        this.caption = photo.getCaption();
        this.contentUrl = "/api/photos/" + photo.getId() + "/content";
        this.createdAt = photo.getCreatedAt();
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

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public String getContentUrl() {
        return contentUrl;
    }

    public void setContentUrl(String contentUrl) {
        this.contentUrl = contentUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
