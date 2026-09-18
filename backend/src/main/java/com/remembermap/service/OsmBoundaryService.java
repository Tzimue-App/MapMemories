package com.remembermap.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.remembermap.api.dto.BoundaryDTO;
import com.remembermap.model.BoundaryCache;
import com.remembermap.repository.BoundaryCacheRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OsmBoundaryService {

    private static final Logger log = LoggerFactory.getLogger(OsmBoundaryService.class);
    private static final String NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

    private final BoundaryCacheRepository boundaryCacheRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeometryFactory geometryFactory;

    public OsmBoundaryService(BoundaryCacheRepository boundaryCacheRepository) {
        this.boundaryCacheRepository = boundaryCacheRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    }

    public List<BoundaryDTO> searchBoundaries(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        String cleanQuery = query.trim();
        List<BoundaryCache> cached = boundaryCacheRepository.findByNameContainingIgnoreCase(cleanQuery);

        if (!cached.isEmpty()) {
            log.info("Found {} cached boundaries for query '{}'", cached.size(), cleanQuery);
            return cached.stream().map(this::mapToDTO).toList();
        }

        log.info("No cache hit for query '{}', querying Nominatim API...", cleanQuery);
        List<BoundaryCache> fetched = fetchFromNominatim(cleanQuery);

        List<BoundaryCache> saved = new ArrayList<>();
        for (BoundaryCache bc : fetched) {
            Optional<BoundaryCache> existing = boundaryCacheRepository.findByOsmId(bc.getOsmId());
            if (existing.isPresent()) {
                saved.add(existing.get());
            } else {
                try {
                    saved.add(boundaryCacheRepository.save(bc));
                } catch (Exception e) {
                    log.warn("Failed to cache boundary {}: {}", bc.getOsmId(), e.getMessage());
                    saved.add(bc);
                }
            }
        }

        return saved.stream().map(this::mapToDTO).toList();
    }

    public Optional<BoundaryDTO> getBoundaryByOsmId(Long osmId) {
        Optional<BoundaryCache> cached = boundaryCacheRepository.findByOsmId(osmId);
        if (cached.isPresent()) {
            return Optional.of(mapToDTO(cached.get()));
        }
        return Optional.empty();
    }

    public List<BoundaryDTO> getAllCachedBoundaries() {
        return boundaryCacheRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    private List<BoundaryCache> fetchFromNominatim(String query) {
        List<BoundaryCache> results = new ArrayList<>();
        try {
            String url = UriComponentsBuilder.fromHttpUrl(NOMINATIM_SEARCH_URL)
                    .queryParam("q", query)
                    .queryParam("format", "json")
                    .queryParam("polygon_geojson", "1")
                    .queryParam("limit", "10")
                    .build().toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "RememberMap/1.0 (contact@remembermap.com)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.isArray()) {
                    for (JsonNode node : root) {
                        Long osmId = node.has("osm_id") ? node.get("osm_id").asLong() : null;
                        String name = node.has("name") ? node.get("name").asText() : null;
                        if (name == null || name.isEmpty()) {
                            if (node.has("display_name")) {
                                String disp = node.get("display_name").asText();
                                name = disp.split(",")[0];
                            } else {
                                name = query;
                            }
                        }
                        String displayName = node.has("display_name") ? node.get("display_name").asText() : name;
                        String boundaryType = node.has("type") ? node.get("type").asText() : "administrative";

                        Integer adminLevel = 8;
                        if (node.has("extratags") && node.get("extratags").has("admin_level")) {
                            try {
                                adminLevel = Integer.parseInt(node.get("extratags").get("admin_level").asText());
                            } catch (NumberFormatException ignored) {
                            }
                        } else if (node.has("addresstype")) {
                            String addressType = node.get("addresstype").asText();
                            if ("country".equalsIgnoreCase(addressType)) adminLevel = 2;
                            else if ("state".equalsIgnoreCase(addressType) || "region".equalsIgnoreCase(addressType)) adminLevel = 4;
                            else if ("county".equalsIgnoreCase(addressType) || "department".equalsIgnoreCase(addressType)) adminLevel = 6;
                            else if ("city".equalsIgnoreCase(addressType) || "town".equalsIgnoreCase(addressType) || "municipality".equalsIgnoreCase(addressType)) adminLevel = 8;
                        } else if ("country".equalsIgnoreCase(boundaryType)) {
                            adminLevel = 2;
                        } else if ("state".equalsIgnoreCase(boundaryType) || "region".equalsIgnoreCase(boundaryType)) {
                            adminLevel = 4;
                        }

                        JsonNode geojsonNode = node.get("geojson");
                        if (geojsonNode != null && osmId != null) {
                            String geojsonStr = objectMapper.writeValueAsString(geojsonNode);
                            Geometry geometry = parseGeoJsonGeometry(geojsonNode);

                            // Only keep items with valid Polygon/MultiPolygon geometry
                            if (geometry != null) {
                                BoundaryCache bc = new BoundaryCache(osmId, name, displayName, boundaryType, adminLevel, geometry, geojsonStr);
                                results.add(bc);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching boundaries from Nominatim: {}", e.getMessage(), e);
        }
        return results;
    }

    public Geometry parseGeoJsonGeometry(JsonNode geojsonNode) {
        if (geojsonNode == null || !geojsonNode.has("type") || !geojsonNode.has("coordinates")) {
            return null;
        }

        String type = geojsonNode.get("type").asText();
        JsonNode coordsNode = geojsonNode.get("coordinates");

        try {
            if ("Polygon".equalsIgnoreCase(type)) {
                return parsePolygon(coordsNode);
            } else if ("MultiPolygon".equalsIgnoreCase(type)) {
                List<Polygon> polygonList = new ArrayList<>();
                for (JsonNode polyNode : coordsNode) {
                    Polygon p = parsePolygon(polyNode);
                    if (p != null) {
                        polygonList.add(p);
                    }
                }
                if (polygonList.isEmpty()) {
                    return null;
                }
                return geometryFactory.createMultiPolygon(polygonList.toArray(new Polygon[0]));
            }
        } catch (Exception e) {
            log.warn("Error building JTS geometry from GeoJSON: {}", e.getMessage());
        }
        return null;
    }

    private Polygon parsePolygon(JsonNode polygonNode) {
        if (!polygonNode.isArray() || polygonNode.isEmpty()) {
            return null;
        }

        LinearRing shell = parseRing(polygonNode.get(0));
        if (shell == null) {
            return null;
        }

        List<LinearRing> holes = new ArrayList<>();
        for (int i = 1; i < polygonNode.size(); i++) {
            LinearRing hole = parseRing(polygonNode.get(i));
            if (hole != null) {
                holes.add(hole);
            }
        }

        return geometryFactory.createPolygon(shell, holes.toArray(new LinearRing[0]));
    }

    private LinearRing parseRing(JsonNode ringNode) {
        if (!ringNode.isArray() || ringNode.isEmpty()) {
            return null;
        }

        List<Coordinate> coords = new ArrayList<>();
        for (JsonNode pt : ringNode) {
            if (pt.isArray() && pt.size() >= 2) {
                double lon = pt.get(0).asDouble();
                double lat = pt.get(1).asDouble();
                coords.add(new Coordinate(lon, lat));
            }
        }

        if (coords.size() < 4) {
            if (!coords.isEmpty()) {
                Coordinate first = coords.get(0);
                while (coords.size() < 3) {
                    coords.add(new Coordinate(first.x, first.y));
                }
                coords.add(new Coordinate(first.x, first.y));
            } else {
                return null;
            }
        } else {
            Coordinate first = coords.get(0);
            Coordinate last = coords.get(coords.size() - 1);
            if (first.x != last.x || first.y != last.y) {
                coords.add(new Coordinate(first.x, first.y));
            }
        }

        return geometryFactory.createLinearRing(coords.toArray(new Coordinate[0]));
    }

    private BoundaryDTO mapToDTO(BoundaryCache bc) {
        return new BoundaryDTO(
                bc.getOsmId(),
                bc.getName(),
                bc.getDisplayName(),
                bc.getBoundaryType(),
                bc.getAdminLevel(),
                bc.getGeojson()
        );
    }
}
