package com.remembermap.api.dto;

import com.remembermap.model.ModificationType;

public class CreateModificationRequest {
    private ModificationType type;
    private String title;
    private String description;
    private Double lat;
    private Double lng;
    private Double radiusMeters;
    private String color;
    private String geojson;
    private Long osmId;

    public CreateModificationRequest() {
    }

    public CreateModificationRequest(ModificationType type, String title, String description, Double lat, Double lng, Double radiusMeters, String color, String geojson, Long osmId) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.lat = lat;
        this.lng = lng;
        this.radiusMeters = radiusMeters;
        this.color = color;
        this.geojson = geojson;
        this.osmId = osmId;
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
}
