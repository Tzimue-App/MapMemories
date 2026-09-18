package com.remembermap.repository;

import com.remembermap.model.BoundaryCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoundaryCacheRepository extends JpaRepository<BoundaryCache, Long> {

    Optional<BoundaryCache> findByOsmId(Long osmId);

    List<BoundaryCache> findByNameContainingIgnoreCase(String name);
}
