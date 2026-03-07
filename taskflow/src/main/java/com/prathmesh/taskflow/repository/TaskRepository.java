package com.prathmesh.taskflow.repository;

import com.prathmesh.taskflow.entity.Task;
import com.prathmesh.taskflow.enums.Priority;
import com.prathmesh.taskflow.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByProjectIdAndDeletedFalse(UUID projectId);

    Optional<Task> findByIdAndDeletedFalse(UUID id);

    List<Task> findByAssigneeIdAndDeletedFalse(UUID assigneeId);

    List<Task> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, TaskStatus status);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndStatusAndDeletedFalse(UUID projectId, TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.deleted = false " +
            "AND (:status IS NULL OR t.status = :status) " +
            "AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)")
    List<Task> findByFilters(@Param("projectId") UUID projectId,
                             @Param("status") TaskStatus status,
                             @Param("assigneeId") UUID assigneeId);

    Page<Task> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Task> findByAssigneeIdAndDeletedFalse(UUID assigneeId, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.deleted = false " +
            "AND (:status IS NULL OR t.status = :status) " +
            "AND (:priority IS NULL OR t.priority = :priority) " +
            "AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId) " +
            "AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "     OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Task> searchTasks(
            @Param("projectId") UUID projectId,
            @Param("status") TaskStatus status,
            @Param("priority") Priority priority,
            @Param("assigneeId") UUID assigneeId,
            @Param("search") String search,
            Pageable pageable);
}