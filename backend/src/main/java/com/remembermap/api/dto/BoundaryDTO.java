package com.remembermap.api.dto;

public class BoundaryDTO {

    private Long osmId;
    private String name;
    private String displayName;
    private String boundaryType;
    private Integer adminLevel;
    private String geojson;

    public BoundaryDTO() {
    }

    public BoundaryDTO(Long osmId, String name, String displayName, String boundaryType, Integer adminLevel, String geojson) {
        this.osmId = osmId;
        this.name = name;
        this.displayName = displayName;
        this.boundaryType = boundaryType;
        this.adminLevel = adminLevel;
        this.geojson = geojson;
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

    public String getGeojson() {
        return geojson;
    }

    public void setGeojson(String geojson) {
        this.geojson = geojson;
    }
}
