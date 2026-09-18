package com.remembermap.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.remembermap.api.dto.BoundaryDTO;
import com.remembermap.model.BoundaryCache;
import com.remembermap.repository.BoundaryCacheRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Geometry;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OsmBoundaryServiceTest {

    @Mock
    private BoundaryCacheRepository repository;

    private OsmBoundaryService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new OsmBoundaryService(repository);
    }

    @Test
    void testSearchBoundariesReturnsCachedWhenAvailable() {
        BoundaryCache cached = new BoundaryCache(
                2001L,
                "Bavaria",
                "Bavaria, Germany",
                "administrative",
                4,
                null,
                "{\"type\":\"Polygon\",\"coordinates\":[[[11.0,48.0],[12.0,48.0],[12.0,49.0],[11.0,49.0],[11.0,48.0]]]}"
        );
        when(repository.findByNameContainingIgnoreCase("Bavaria")).thenReturn(List.of(cached));

        List<BoundaryDTO> result = service.searchBoundaries("Bavaria");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Bavaria");
        assertThat(result.get(0).getOsmId()).isEqualTo(2001L);
    }

    @Test
    void testParseGeoJsonPolygon() throws Exception {
        String jsonStr = "{\"type\":\"Polygon\",\"coordinates\":[[[2.0,48.0],[3.0,48.0],[3.0,49.0],[2.0,49.0],[2.0,48.0]]]}";
        Geometry geom = service.parseGeoJsonGeometry(objectMapper.readTree(jsonStr));

        assertThat(geom).isNotNull();
        assertThat(geom.getGeometryType()).isEqualTo("Polygon");
        assertThat(geom.getCoordinates()).hasSize(5);
    }

    @Test
    void testParseGeoJsonMultiPolygon() throws Exception {
        String jsonStr = "{\"type\":\"MultiPolygon\",\"coordinates\":[" +
                "[[[2.0,48.0],[3.0,48.0],[3.0,49.0],[2.0,49.0],[2.0,48.0]]]," +
                "[[[4.0,50.0],[5.0,50.0],[5.0,51.0],[4.0,51.0],[4.0,50.0]]]" +
                "]}";
        Geometry geom = service.parseGeoJsonGeometry(objectMapper.readTree(jsonStr));

        assertThat(geom).isNotNull();
        assertThat(geom.getGeometryType()).isEqualTo("MultiPolygon");
    }

    @Test
    void testGetBoundaryByOsmIdFound() {
        BoundaryCache cached = new BoundaryCache(
                3001L,
                "Spain",
                "Kingdom of Spain",
                "administrative",
                2,
                null,
                "{}"
        );
        when(repository.findByOsmId(3001L)).thenReturn(Optional.of(cached));

        Optional<BoundaryDTO> dto = service.getBoundaryByOsmId(3001L);

        assertThat(dto).isPresent();
        assertThat(dto.get().getName()).isEqualTo("Spain");
    }
}
