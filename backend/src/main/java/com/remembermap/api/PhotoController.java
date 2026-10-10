package com.remembermap.api;

import com.remembermap.api.dto.PhotoDTO;
import com.remembermap.model.Photo;
import com.remembermap.model.User;
import com.remembermap.service.CustomUserDetailsService;
import com.remembermap.service.PhotoService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PhotoController {

    private final PhotoService photoService;
    private final CustomUserDetailsService userDetailsService;

    public PhotoController(PhotoService photoService, CustomUserDetailsService userDetailsService) {
        this.photoService = photoService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping(value = "/modifications/{modificationId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoDTO> uploadPhoto(
            @PathVariable Long modificationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userDetailsService.loadUserEntityByUsername(userDetails.getUsername());
        PhotoDTO dto = photoService.savePhoto(modificationId, file, caption, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/modifications/{modificationId}/photos")
    public ResponseEntity<List<PhotoDTO>> getPhotosForModification(
            @PathVariable Long modificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userDetailsService.loadUserEntityByUsername(userDetails.getUsername());
        List<PhotoDTO> photos = photoService.getPhotosForModification(modificationId, currentUser);
        return ResponseEntity.ok(photos);
    }

    @GetMapping("/photos/{id}/content")
    public ResponseEntity<InputStreamResource> getPhotoContent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userDetailsService.loadUserEntityByUsername(userDetails.getUsername());
        Photo photo = photoService.getPhotoEntityForUser(id, currentUser);
        InputStream inputStream = photoService.getPhotoContent(id, currentUser);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + photo.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .contentLength(photo.getSize())
                .body(new InputStreamResource(inputStream));
    }

    @DeleteMapping("/modifications/{modificationId}/photos/{id}")
    public ResponseEntity<Void> deletePhoto(
            @PathVariable Long modificationId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userDetailsService.loadUserEntityByUsername(userDetails.getUsername());
        photoService.deletePhoto(modificationId, id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
