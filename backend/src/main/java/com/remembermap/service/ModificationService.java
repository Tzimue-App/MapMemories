package com.remembermap.service;

import com.remembermap.api.dto.CreateModificationRequest;
import com.remembermap.api.dto.ModificationDTO;
import com.remembermap.model.Modification;
import com.remembermap.model.User;
import com.remembermap.repository.ModificationRepository;
import com.remembermap.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModificationService {

    private final ModificationRepository modificationRepository;
    private final UserRepository userRepository;

    public ModificationService(ModificationRepository modificationRepository, UserRepository userRepository) {
        this.modificationRepository = modificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ModificationDTO createModification(String username, CreateModificationRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Modification modification = new Modification(
                request.getType(),
                request.getTitle(),
                request.getDescription(),
                request.getLat(),
                request.getLng(),
                request.getRadiusMeters(),
                request.getColor(),
                request.getGeojson(),
                request.getOsmId(),
                user
        );

        Modification saved = modificationRepository.save(modification);
        return new ModificationDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ModificationDTO> getUserModifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return modificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(ModificationDTO::new)
                .toList();
    }

    @Transactional
    public boolean deleteModification(String username, Long modificationId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return modificationRepository.findByIdAndUser(modificationId, user)
                .map(modification -> {
                    modificationRepository.delete(modification);
                    return true;
                })
                .orElse(false);
    }
}
