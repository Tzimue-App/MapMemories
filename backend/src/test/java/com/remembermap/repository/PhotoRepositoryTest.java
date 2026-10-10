package com.remembermap.repository;

import com.remembermap.model.Modification;
import com.remembermap.model.ModificationType;
import com.remembermap.model.Photo;
import com.remembermap.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class PhotoRepositoryTest {

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private ModificationRepository modificationRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;
    private Modification mod1;
    private Modification mod2;

    @BeforeEach
    void setUp() {
        photoRepository.deleteAll();
        modificationRepository.deleteAll();
        userRepository.deleteAll();

        user1 = userRepository.save(new User("u1", "u1@example.com", "pass"));
        user2 = userRepository.save(new User("u2", "u2@example.com", "pass"));

        mod1 = modificationRepository.save(new Modification(
                ModificationType.PIN, "Pin 1", "Desc", 48.85, 2.35, null, "#ff0000", null, null, user1
        ));

        mod2 = modificationRepository.save(new Modification(
                ModificationType.PIN, "Pin 2", "Desc", 48.86, 2.36, null, "#00ff00", null, null, user2
        ));
    }

    @Test
    void testFindByModificationIdAndUserIdOrderByCreatedAtDesc() {
        Photo photo1 = photoRepository.save(new Photo("obj1", "file1.jpg", "image/jpeg", 100L, "Cap 1", mod1, user1));
        Photo photo2 = photoRepository.save(new Photo("obj2", "file2.jpg", "image/jpeg", 200L, "Cap 2", mod1, user1));

        List<Photo> user1Photos = photoRepository.findByModificationIdAndUserIdOrderByCreatedAtDesc(mod1.getId(), user1.getId());
        assertThat(user1Photos).hasSize(2);

        List<Photo> user2Photos = photoRepository.findByModificationIdAndUserIdOrderByCreatedAtDesc(mod1.getId(), user2.getId());
        assertThat(user2Photos).isEmpty();
    }

    @Test
    void testFindByIdAndUserId() {
        Photo photo = photoRepository.save(new Photo("obj1", "file1.jpg", "image/jpeg", 100L, "Cap 1", mod1, user1));

        Optional<Photo> foundForOwner = photoRepository.findByIdAndUserId(photo.getId(), user1.getId());
        assertThat(foundForOwner).isPresent();

        Optional<Photo> foundForOther = photoRepository.findByIdAndUserId(photo.getId(), user2.getId());
        assertThat(foundForOther).isEmpty();
    }
}
