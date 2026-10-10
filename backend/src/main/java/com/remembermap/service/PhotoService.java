package com.remembermap.service;

import com.remembermap.api.dto.PhotoDTO;
import com.remembermap.model.Modification;
import com.remembermap.model.Photo;
import com.remembermap.model.User;
import com.remembermap.repository.ModificationRepository;
import com.remembermap.repository.PhotoRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PhotoService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit
    private final PhotoRepository photoRepository;
    private final ModificationRepository modificationRepository;
    private final MinioStorageService minioStorageService;

    public PhotoService(PhotoRepository photoRepository,
                        ModificationRepository modificationRepository,
                        MinioStorageService minioStorageService) {
        this.photoRepository = photoRepository;
        this.modificationRepository = modificationRepository;
        this.minioStorageService = minioStorageService;
    }

    @Transactional
    public PhotoDTO savePhoto(Long modificationId, MultipartFile file, String caption, User user) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size (10MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files (JPEG, PNG, WebP, GIF) are supported");
        }

        Modification modification = modificationRepository.findById(modificationId)
                .orElseThrow(() -> new IllegalArgumentException("Modification not found: " + modificationId));

        if (!modification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this pin/boundary");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            filename = "upload.jpg";
        }
        String sanitizedFilename = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String objectName = String.format("photos/%d/%d/%s_%s", user.getId(), modificationId, UUID.randomUUID(), sanitizedFilename);

        minioStorageService.uploadFile(file, objectName);

        Photo photo = new Photo(objectName, filename, contentType, file.getSize(), caption, modification, user);
        Photo saved = photoRepository.save(photo);

        return new PhotoDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<PhotoDTO> getPhotosForModification(Long modificationId, User user) {
        return photoRepository.findByModificationIdAndUserIdOrderByCreatedAtDesc(modificationId, user.getId())
                .stream()
                .map(PhotoDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Photo getPhotoEntityForUser(Long photoId, User user) {
        return photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Photo not found or permission denied"));
    }

    @Transactional(readOnly = true)
    public InputStream getPhotoContent(Long photoId, User user) {
        Photo photo = getPhotoEntityForUser(photoId, user);
        return minioStorageService.getFile(photo.getObjectName());
    }

    @Transactional
    public void deletePhoto(Long modificationId, Long photoId, User user) {
        Photo photo = photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Photo not found or permission denied"));

        if (!photo.getModification().getId().equals(modificationId)) {
            throw new IllegalArgumentException("Photo does not belong to modification " + modificationId);
        }

        minioStorageService.deleteFile(photo.getObjectName());
        photoRepository.delete(photo);
    }
}
