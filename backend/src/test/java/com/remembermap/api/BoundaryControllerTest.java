package com.remembermap.api;

import com.remembermap.api.dto.BoundaryDTO;
import com.remembermap.service.OsmBoundaryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BoundaryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OsmBoundaryService osmBoundaryService;

    @Test
    void testSearchBoundariesEndpoint() throws Exception {
        BoundaryDTO dto = new BoundaryDTO(
                101L,
                "Lyon",
                "Lyon, France",
                "administrative",
                8,
                "{\"type\":\"Polygon\"}"
        );
        when(osmBoundaryService.searchBoundaries("Lyon")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/boundaries/search")
                        .param("query", "Lyon")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].osmId").value(101))
                .andExpect(jsonPath("$[0].name").value("Lyon"))
                .andExpect(jsonPath("$[0].boundaryType").value("administrative"));
    }

    @Test
    void testGetBoundaryByOsmIdFound() throws Exception {
        BoundaryDTO dto = new BoundaryDTO(
                202L,
                "Tokyo",
                "Tokyo, Japan",
                "administrative",
                4,
                "{}"
        );
        when(osmBoundaryService.getBoundaryByOsmId(202L)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/boundaries/202")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tokyo"));
    }

    @Test
    void testGetBoundaryByOsmIdNotFound() throws Exception {
        when(osmBoundaryService.getBoundaryByOsmId(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/boundaries/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
