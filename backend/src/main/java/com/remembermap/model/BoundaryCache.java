package com.remembermap.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Geometry;

import java.time.LocalDateTime;

@Entity
@Table(name = "boundary_cache")
public class BoundaryCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "osm_id", unique = true)
    private Long osmId;

    @Column(name = "name")
    private String name;

    @Column(name = "display_name", length = 1000)
    private String displayName;

    @Column(name = "boundary_type")
    private String boundaryType;

    @Column(name = "admin_level")
    private Integer adminLevel;

    @Column(name = "geometry", columnDefinition = "geometry(Geometry,4326)")
    private Geometry geometry;

    @Column(name = "geojson", columnDefinition = "TEXT")
    private String geojson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public BoundaryCache() {
    }

    public BoundaryCache(Long osmId, String name, String displayName, String boundaryType, Integer adminLevel, Geometry geometry, String geojson) {
        this.osmId = osmId;
        this.name = name;
        this.displayName = displayName;
        this.boundaryType = boundaryType;
        this.adminLevel = adminLevel;
        this.geometry = geometry;
        this.geojson = geojson;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOsmId() {
        return osmId;
    }

    public void setOsmId(Long osmId) {
        this.osmId = osmId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBoundaryType() {
        return boundaryType;
    }

    public void setBoundaryType(String boundaryType) {
        this.boundaryType = boundaryType;
    }

    public Integer getAdminLevel() {
        return adminLevel;
    }

    public void setAdminLevel(Integer adminLevel) {
        this.adminLevel = adminLevel;
    }

    public Geometry getGeometry() {
        return geometry;
    }

    public void setGeometry(Geometry geometry) {
        this.geometry = geometry;
    }

    public String getGeojson() {
        return geojson;
    }

    public void setGeojson(String geojson) {
        this.geojson = geojson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
