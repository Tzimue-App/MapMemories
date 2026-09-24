package com.remembermap.repository;

import com.remembermap.model.Modification;
import com.remembermap.model.ModificationType;
import com.remembermap.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ModificationRepositoryTest {

    @Autowired
    private ModificationRepository modificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSaveAndFindByUser() {
        User user1 = userRepository.save(new User("user1", "u1@example.com", "pass"));
        User user2 = userRepository.save(new User("user2", "u2@example.com", "pass"));

        Modification mod1 = new Modification(ModificationType.PIN, "My Pin", "A note", 48.8566, 2.3522, null, "#ff0000", null, null, user1);
        Modification mod2 = new Modification(ModificationType.RADIUS, "Circle Area", "Danger zone", 48.8566, 2.3522, 5000.0, "#00ff00", null, null, user1);
        Modification mod3 = new Modification(ModificationType.PIN, "User2 Pin", "Other", 45.0, 5.0, null, "#0000ff", null, null, user2);

        modificationRepository.saveAll(List.of(mod1, mod2, mod3));

        List<Modification> user1Mods = modificationRepository.findByUserOrderByCreatedAtDesc(user1);
        assertThat(user1Mods).hasSize(2);
        assertThat(user1Mods.get(0).getUser().getUsername()).isEqualTo("user1");

        Optional<Modification> found = modificationRepository.findByIdAndUser(mod1.getId(), user1);
        assertThat(found).isPresent();

        Optional<Modification> notFoundForUser2 = modificationRepository.findByIdAndUser(mod1.getId(), user2);
        assertThat(notFoundForUser2).isEmpty();
    }
}
