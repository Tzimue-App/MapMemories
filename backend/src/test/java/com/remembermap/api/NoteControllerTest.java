package com.remembermap.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.remembermap.model.Modification;
import com.remembermap.model.ModificationType;
import com.remembermap.model.User;
import com.remembermap.repository.ModificationRepository;
import com.remembermap.repository.NoteRepository;
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

import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModificationRepository modificationRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private String token;
    private Modification userModification;

    @BeforeEach
    void setUp() {
        noteRepository.deleteAll();
        modificationRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(new User("noteuser", "note@example.com", passwordEncoder.encode("secret")));
        token = jwtService.generateToken(testUser.getUsername());

        userModification = modificationRepository.save(new Modification(
                ModificationType.PIN, "Note Pin", "Desc", 48.85, 2.35, null, "#ff0000", null, null, testUser
        ));
    }

    @Test
    void testCreateAndGetNotesAuthenticated() throws Exception {
        Map<String, String> body = Map.of("content", "This is a memory note");

        mockMvc.perform(post("/api/modifications/" + userModification.getId() + "/notes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content", is("This is a memory note")));

        mockMvc.perform(get("/api/modifications/" + userModification.getId() + "/notes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].content", is("This is a memory note")));
    }
}
