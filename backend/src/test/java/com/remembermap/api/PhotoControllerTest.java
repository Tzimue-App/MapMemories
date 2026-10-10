package com.remembermap.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.remembermap.model.Modification;
import com.remembermap.model.ModificationType;
import com.remembermap.model.User;
import com.remembermap.repository.ModificationRepository;
import com.remembermap.repository.PhotoRepository;
import com.remembermap.repository.UserRepository;
import com.remembermap.service.JwtService;
import com.remembermap.service.MinioStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PhotoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModificationRepository modificationRepository;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MinioStorageService minioStorageService;

    private User testUser;
    private User otherUser;
    private String token;
    private String otherToken;
    private Modification userModification;

    @BeforeEach
    void setUp() {
        photoRepository.deleteAll();
        modificationRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(new User("photouser", "photo@example.com", passwordEncoder.encode("secret")));
        otherUser = userRepository.save(new User("otheruser", "other@example.com", passwordEncoder.encode("secret")));

        token = jwtService.generateToken(testUser.getUsername());
        otherToken = jwtService.generateToken(otherUser.getUsername());

        userModification = modificationRepository.save(new Modification(
                ModificationType.PIN, "Photo Pin", "Desc", 48.85, 2.35, null, "#ff0000", null, null, testUser
        ));
    }

    @Test
    void testUploadPhotoUnauthenticated() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "image content".getBytes()
        );

        mockMvc.perform(multipart("/api/modifications/" + userModification.getId() + "/photos")
                        .file(file)
                        .param("caption", "My Photo"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testUploadAndListPhotoAuthenticated() throws Exception {
        when(minioStorageService.uploadFile(any(), any())).thenReturn("photos/1/100/uuid_test.jpg");

        MockMultipartFile file = new MockMultipartFile(
                "file", "vacation.jpg", "image/jpeg", "vacation image data".getBytes()
        );

        mockMvc.perform(multipart("/api/modifications/" + userModification.getId() + "/photos")
                        .file(file)
                        .param("caption", "Eiffel Tower View")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFilename", is("vacation.jpg")))
                .andExpect(jsonPath("$.caption", is("Eiffel Tower View")));

        mockMvc.perform(get("/api/modifications/" + userModification.getId() + "/photos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].caption", is("Eiffel Tower View")));
    }

    @Test
    void testGetPhotosForbiddenForOtherUser() throws Exception {
        mockMvc.perform(get("/api/modifications/" + userModification.getId() + "/photos")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
