package com.remembermap.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.remembermap.api.dto.CreateModificationRequest;
import com.remembermap.model.ModificationType;
import com.remembermap.model.User;
import com.remembermap.repository.ModificationRepository;
import com.remembermap.repository.UserRepository;
import com.remembermap.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ModificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModificationRepository modificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private String token;

    @BeforeEach
    void setUp() {
        modificationRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(new User("moduser", "mod@example.com", passwordEncoder.encode("secret")));
        token = jwtService.generateToken(testUser.getUsername());
    }

    @Test
    void testCreateModificationUnauthenticated() throws Exception {
        CreateModificationRequest req = new CreateModificationRequest(
                ModificationType.PIN, "Unauthenticated Pin", "Note", 48.85, 2.35, null, "#ff0000", null, null
        );

        mockMvc.perform(post("/api/modifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testCreateAndGetModificationsAuthenticated() throws Exception {
        CreateModificationRequest req = new CreateModificationRequest(
                ModificationType.PIN, "My Saved Pin", "Note about pin", 48.8566, 2.3522, null, "#ff0000", null, null
        );

        mockMvc.perform(post("/api/modifications")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("My Saved Pin")))
                .andExpect(jsonPath("$.type", is("PIN")));

        mockMvc.perform(get("/api/modifications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("My Saved Pin")));
    }

    @Test
    void testDeleteModificationAuthenticated() throws Exception {
        CreateModificationRequest req = new CreateModificationRequest(
                ModificationType.RADIUS, "Circle", "Circle note", 48.8566, 2.3522, 1000.0, "#00ff00", null, null
        );

        String responseContent = mockMvc.perform(post("/api/modifications")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long modId = objectMapper.readTree(responseContent).get("id").asLong();

        mockMvc.perform(delete("/api/modifications/" + modId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/modifications")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
