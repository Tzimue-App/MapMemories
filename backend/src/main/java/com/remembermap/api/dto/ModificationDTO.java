package com.remembermap.api.dto;

import com.remembermap.model.Modification;
import com.remembermap.model.ModificationType;

import java.time.LocalDateTime;

public class ModificationDTO {
    private Long id;
    private ModificationType type;
    private String title;
    private String description;
    private Double lat;
    private Double lng;
    private Double radiusMeters;
    private String color;
    private String geojson;
    private Long osmId;
    private LocalDateTime createdAt;
    private java.util.List<PhotoDTO> photos = new java.util.ArrayList<>();
    private java.util.List<NoteDTO> notes = new java.util.ArrayList<>();

    public ModificationDTO() {
    }

    public ModificationDTO(Modification modification) {
        this.id = modification.getId();
        this.type = modification.getType();
        this.title = modification.getTitle();
        this.description = modification.getDescription();
        this.lat = modification.getLat();
        this.lng = modification.getLng();
        this.radiusMeters = modification.getRadiusMeters();
        this.color = modification.getColor();
        this.geojson = modification.getGeojson();
        this.osmId = modification.getOsmId();
        this.createdAt = modification.getCreatedAt();
    }

    public java.util.List<PhotoDTO> getPhotos() {
        return photos;
    }

    public void setPhotos(java.util.List<PhotoDTO> photos) {
        this.photos = photos;
    }

    public java.util.List<NoteDTO> getNotes() {
        return notes;
    }

    public void setNotes(java.util.List<NoteDTO> notes) {
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ModificationType getType() {
        return type;
    }

    public void setType(ModificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public Double getRadiusMeters() {
        return radiusMeters;
    }

    public void setRadiusMeters(Double radiusMeters) {
        this.radiusMeters = radiusMeters;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getGeojson() {
        return geojson;
    }

    public void setGeojson(String geojson) {
        this.geojson = geojson;
    }

    public Long getOsmId() {
        return osmId;
    }

    public void setOsmId(Long osmId) {
        this.osmId = osmId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
