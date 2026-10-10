package com.remembermap.repository;

import com.remembermap.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByModificationIdAndUserIdOrderByCreatedAtDesc(Long modificationId, Long userId);
    Optional<Note> findByIdAndUserId(Long id, Long userId);
}
