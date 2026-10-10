package com.remembermap.service;

import com.remembermap.api.dto.PhotoDTO;
import com.remembermap.model.Modification;
import com.remembermap.model.ModificationType;
import com.remembermap.model.Photo;
import com.remembermap.model.User;
import com.remembermap.repository.ModificationRepository;
import com.remembermap.repository.PhotoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private ModificationRepository modificationRepository;

    @Mock
    private MinioStorageService minioStorageService;

    private PhotoService photoService;

    private User owner;
    private User otherUser;
    private Modification modification;

    @BeforeEach
    void setUp() {
        photoService = new PhotoService(photoRepository, modificationRepository, minioStorageService);

        owner = new User("owner", "owner@example.com", "pass");
        owner.setId(1L);

        otherUser = new User("other", "other@example.com", "pass");
        otherUser.setId(2L);

        modification = new Modification(
                ModificationType.PIN, "Test Pin", "Desc", 48.85, 2.35, null, "#ff0000", null, null, owner
        );
        modification.setId(100L);
    }

    @Test
    void testSavePhotoSuccess() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "vacation.jpg", "image/jpeg", "fake image data".getBytes()
        );

        when(modificationRepository.findById(100L)).thenReturn(Optional.of(modification));
        when(minioStorageService.uploadFile(any(), any())).thenReturn("photos/1/100/uuid_vacation.jpg");

        Photo savedPhoto = new Photo("photos/1/100/uuid_vacation.jpg", "vacation.jpg", "image/jpeg", (long) file.getBytes().length, "Eiffel Tower", modification, owner);
        savedPhoto.setId(500L);
        when(photoRepository.save(any(Photo.class))).thenReturn(savedPhoto);

        PhotoDTO dto = photoService.savePhoto(100L, file, "Eiffel Tower", owner);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(500L);
        assertThat(dto.getOriginalFilename()).isEqualTo("vacation.jpg");
        assertThat(dto.getCaption()).isEqualTo("Eiffel Tower");
        verify(photoRepository).save(any(Photo.class));
    }

    @Test
    void testSavePhotoInvalidFileType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "document.pdf", "application/pdf", "pdf content".getBytes()
        );

        assertThatThrownBy(() -> photoService.savePhoto(100L, file, "Pdf", owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only image files");
    }

    @Test
    void testSavePhotoExceedsMaxSize() throws Exception {
        byte[] largeContent = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile file = new MockMultipartFile(
                "file", "huge.jpg", "image/jpeg", largeContent
        );

        assertThatThrownBy(() -> photoService.savePhoto(100L, file, "Huge", owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds maximum allowed size");
    }

    @Test
    void testSavePhotoForbiddenForNonOwner() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.png", "image/png", "img".getBytes()
        );

        when(modificationRepository.findById(100L)).thenReturn(Optional.of(modification));

        assertThatThrownBy(() -> photoService.savePhoto(100L, file, "Photo", otherUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void testDeletePhotoSuccess() {
        Photo photo = new Photo("photos/1/100/file.jpg", "file.jpg", "image/jpeg", 100L, "Cap", modification, owner);
        photo.setId(500L);

        when(photoRepository.findByIdAndUserId(500L, 1L)).thenReturn(Optional.of(photo));

        photoService.deletePhoto(100L, 500L, owner);

        verify(minioStorageService).deleteFile("photos/1/100/file.jpg");
        verify(photoRepository).delete(photo);
    }
}
