package com.prathmesh.taskflow.repository;

import com.prathmesh.taskflow.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {

    Optional<Team> findByProjectId(UUID projectId);
}