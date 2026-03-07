package com.prathmesh.taskflow.repository;

import com.prathmesh.taskflow.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByOwnerIdAndArchivedFalse(UUID ownerId);

    Optional<Project> findByIdAndArchivedFalse(UUID id);

    // Paginated
    Page<Project> findByOwnerIdAndArchivedFalse(UUID ownerId, Pageable pageable);

    // Search
    @Query("SELECT p FROM Project p WHERE p.owner.id = :ownerId AND p.archived = false " +
            "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchProjects(
            @Param("ownerId") UUID ownerId,
            @Param("search") String search,
            Pageable pageable);
}