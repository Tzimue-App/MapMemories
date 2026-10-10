package com.remembermap.repository;

import com.remembermap.model.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByModificationIdAndUserIdOrderByCreatedAtDesc(Long modificationId, Long userId);
    Optional<Photo> findByIdAndUserId(Long id, Long userId);
    List<Photo> findByUserId(Long userId);
}
