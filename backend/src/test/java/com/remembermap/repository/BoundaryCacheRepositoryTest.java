package com.remembermap.repository;

import com.remembermap.model.BoundaryCache;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class BoundaryCacheRepositoryTest {

    @Autowired
    private BoundaryCacheRepository repository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Test
    void testSaveAndFindByOsmId() {
        Coordinate[] coords = new Coordinate[]{
                new Coordinate(2.29, 48.85),
                new Coordinate(2.35, 48.85),
                new Coordinate(2.35, 48.90),
                new Coordinate(2.29, 48.90),
                new Coordinate(2.29, 48.85)
        };
        LinearRing ring = geometryFactory.createLinearRing(coords);
        Polygon polygon = geometryFactory.createPolygon(ring);

        BoundaryCache boundary = new BoundaryCache(
                1001L,
                "Paris",
                "Paris, Île-de-France, France",
                "administrative",
                8,
                polygon,
                "{\"type\":\"Polygon\"}"
        );

        repository.save(boundary);

        Optional<BoundaryCache> found = repository.findByOsmId(1001L);
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Paris");
        assertThat(found.get().getAdminLevel()).isEqualTo(8);
        assertThat(found.get().getGeometry()).isNotNull();
    }

    @Test
    void testFindByNameContainingIgnoreCase() {
        BoundaryCache b1 = new BoundaryCache(
                1002L,
                "Île-de-France",
                "Île-de-France, France",
                "administrative",
                4,
                null,
                "{}"
        );
        repository.save(b1);

        List<BoundaryCache> results = repository.findByNameContainingIgnoreCase("france");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Île-de-France");
    }
}
