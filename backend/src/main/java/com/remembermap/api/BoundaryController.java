package com.remembermap.api;

import com.remembermap.api.dto.BoundaryDTO;
import com.remembermap.service.OsmBoundaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/boundaries")
public class BoundaryController {

    private final OsmBoundaryService osmBoundaryService;

    public BoundaryController(OsmBoundaryService osmBoundaryService) {
        this.osmBoundaryService = osmBoundaryService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<BoundaryDTO>> searchBoundaries(@RequestParam("query") String query) {
        List<BoundaryDTO> results = osmBoundaryService.searchBoundaries(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{osmId}")
    public ResponseEntity<BoundaryDTO> getBoundaryByOsmId(@PathVariable("osmId") Long osmId) {
        return osmBoundaryService.getBoundaryByOsmId(osmId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<BoundaryDTO>> getAllCachedBoundaries() {
        List<BoundaryDTO> results = osmBoundaryService.getAllCachedBoundaries();
        return ResponseEntity.ok(results);
    }
}
