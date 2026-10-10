package com.remembermap.repository;

import com.remembermap.model.Modification;
import com.remembermap.model.ModificationType;
import com.remembermap.model.Note;
import com.remembermap.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class NoteRepositoryTest {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private ModificationRepository modificationRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;
    private Modification mod;

    @BeforeEach
    void setUp() {
        noteRepository.deleteAll();
        modificationRepository.deleteAll();
        userRepository.deleteAll();

        user1 = userRepository.save(new User("nu1", "nu1@example.com", "pass"));
        user2 = userRepository.save(new User("nu2", "nu2@example.com", "pass"));

        mod = modificationRepository.save(new Modification(
                ModificationType.PIN, "Pin Note Test", "Desc", 48.85, 2.35, null, "#ff0000", null, null, user1
        ));
    }

    @Test
    void testSaveAndFindNotesForUser() {
        Note note1 = noteRepository.save(new Note("First note content", mod, user1));
        Note note2 = noteRepository.save(new Note("Second note content", mod, user1));

        List<Note> notesUser1 = noteRepository.findByModificationIdAndUserIdOrderByCreatedAtDesc(mod.getId(), user1.getId());
        assertThat(notesUser1).hasSize(2);

        List<Note> notesUser2 = noteRepository.findByModificationIdAndUserIdOrderByCreatedAtDesc(mod.getId(), user2.getId());
        assertThat(notesUser2).isEmpty();
    }

    @Test
    void testFindByIdAndUserId() {
        Note note = noteRepository.save(new Note("Secret note", mod, user1));

        Optional<Note> found = noteRepository.findByIdAndUserId(note.getId(), user1.getId());
        assertThat(found).isPresent();

        Optional<Note> notFound = noteRepository.findByIdAndUserId(note.getId(), user2.getId());
        assertThat(notFound).isEmpty();
    }
}
