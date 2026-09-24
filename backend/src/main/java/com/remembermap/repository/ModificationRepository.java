package com.remembermap.repository;

import com.remembermap.model.Modification;
import com.remembermap.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModificationRepository extends JpaRepository<Modification, Long> {

    List<Modification> findByUserOrderByCreatedAtDesc(User user);

    Optional<Modification> findByIdAndUser(Long id, User user);
}
