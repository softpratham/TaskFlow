package com.prathmesh.taskflow.service;

import com.prathmesh.taskflow.dto.request.CreateTaskRequest;
import com.prathmesh.taskflow.dto.request.StatusTransitionRequest;
import com.prathmesh.taskflow.dto.request.UpdateTaskRequest;
import com.prathmesh.taskflow.dto.response.PagedResponse;
import com.prathmesh.taskflow.dto.response.TaskResponse;
import com.prathmesh.taskflow.entity.Project;
import com.prathmesh.taskflow.entity.Task;
import com.prathmesh.taskflow.entity.Team;
import com.prathmesh.taskflow.entity.User;
import com.prathmesh.taskflow.enums.Priority;
import com.prathmesh.taskflow.enums.TaskStatus;
import com.prathmesh.taskflow.exception.BadRequestException;
import com.prathmesh.taskflow.exception.ConflictException;
import com.prathmesh.taskflow.exception.ResourceNotFoundException;
import com.prathmesh.taskflow.exception.UnauthorizedAccessException;
import com.prathmesh.taskflow.repository.ProjectRepository;
import com.prathmesh.taskflow.repository.TaskRepository;
import com.prathmesh.taskflow.repository.TeamRepository;
import com.prathmesh.taskflow.repository.UserRepository;
import com.prathmesh.taskflow.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final NotificationService notificationService;

    @Transactional
    public TaskResponse createTask(UUID projectId, CreateTaskRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (!project.getOwner().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("Only the project owner can create tasks");
        }

        Priority priority;
        try {
            priority = Priority.valueOf(request.getPriority().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority: " + request.getPriority() + ". Must be LOW, MEDIUM, or HIGH");
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TaskStatus.TODO)
                .priority(priority)
                .dueDate(request.getDueDate())
                .project(project)
                .createdBy(currentUserId)
                .updatedBy(currentUserId)
                .build();

        if (request.getAssigneeId() != null) {
            User assignee = validateAndGetAssignee(request.getAssigneeId(), projectId);
            task.setAssignee(assignee);
        }

        Task savedTask = taskRepository.save(task);
        log.info("Task '{}' created in project {} by user {}", savedTask.getTitle(), projectId, currentUserId);

        if (savedTask.getAssignee() != null) {
            User assigner = userRepository.findById(currentUserId).orElse(null);
            if (assigner != null) {
                notificationService.notifyTaskAssigned(savedTask, savedTask.getAssignee(), assigner);
            }
        }

        return mapToResponse(savedTask);
    }

    public TaskResponse getTask(UUID taskId) {
        Task task = getTaskOrThrow(taskId);
        verifyProjectAccess(task.getProject().getId());
        return mapToResponse(task);
    }

    public List<TaskResponse> getTasksByProject(UUID projectId, String status, UUID assigneeId) {
        verifyProjectAccess(projectId);

        TaskStatus taskStatus = null;
        if (status != null) {
            try {
                taskStatus = TaskStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status: " + status);
            }
        }

        List<Task> tasks = taskRepository.findByFilters(projectId, taskStatus, assigneeId);
        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<TaskResponse> getMyTasks() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<Task> tasks = taskRepository.findByAssigneeIdAndDeletedFalse(currentUserId);
        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ===== Paginated Task List =====

    public PagedResponse<TaskResponse> getTasksPaginated(UUID projectId, int page, int size, String sortBy, String direction) {
        verifyProjectAccess(projectId);

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Task> taskPage = taskRepository.findByProjectIdAndDeletedFalse(projectId, pageable);
        Page<TaskResponse> responsePage = taskPage.map(this::mapToResponse);
        return PagedResponse.of(responsePage);
    }

    // ===== Search & Filter Tasks =====

    public PagedResponse<TaskResponse> searchTasks(UUID projectId, TaskStatus status, Priority priority,
                                                   UUID assigneeId, String search, int page, int size,
                                                   String sortBy, String direction) {
        verifyProjectAccess(projectId);

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Task> taskPage = taskRepository.searchTasks(projectId, status, priority, assigneeId, search, pageable);
        Page<TaskResponse> responsePage = taskPage.map(this::mapToResponse);
        return PagedResponse.of(responsePage);
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, UpdateTaskRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = getTaskOrThrow(taskId);

        if (!task.getProject().getOwner().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("Only the project owner can update task details");
        }

        try {
            if (request.getTitle() != null) {
                task.setTitle(request.getTitle());
            }
            if (request.getDescription() != null) {
                task.setDescription(request.getDescription());
            }
            if (request.getPriority() != null) {
                try {
                    task.setPriority(Priority.valueOf(request.getPriority().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid priority: " + request.getPriority());
                }
            }
            if (request.getDueDate() != null) {
                task.setDueDate(request.getDueDate());
            }
            if (request.getAssigneeId() != null) {
                User assignee = validateAndGetAssignee(request.getAssigneeId(), task.getProject().getId());
                task.setAssignee(assignee);
            }

            task.setUpdatedBy(currentUserId);
            Task savedTask = taskRepository.save(task);

            log.info("Task '{}' updated by user {}", savedTask.getTitle(), currentUserId);
            return mapToResponse(savedTask);

        } catch (ObjectOptimisticLockingFailureException e) {
            throw new ConflictException("Task was modified by another user. Please refresh and try again.");
        }
    }

    @Transactional
    public TaskResponse transitionStatus(UUID taskId, StatusTransitionRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = getTaskOrThrow(taskId);

        boolean isOwner = task.getProject().getOwner().getId().equals(currentUserId);
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUserId);

        if (!isOwner && !isAssignee) {
            throw new UnauthorizedAccessException("Only the assignee or project owner can change task status");
        }

        TaskStatus targetStatus;
        try {
            targetStatus = TaskStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + request.getStatus());
        }

        if (!task.getStatus().canTransitionTo(targetStatus)) {
            throw new BadRequestException(
                    String.format("Cannot transition from %s to %s", task.getStatus(), targetStatus));
        }

        try {
            TaskStatus oldStatus = task.getStatus();
            task.setStatus(targetStatus);
            task.setUpdatedBy(currentUserId);
            Task savedTask = taskRepository.save(task);

            log.info("Task '{}' status changed: {} → {} by user {}",
                    savedTask.getTitle(), oldStatus, targetStatus, currentUserId);

            User changedBy = userRepository.findById(currentUserId).orElse(null);
            if (changedBy != null) {
                notificationService.notifyStatusChanged(savedTask, oldStatus, targetStatus, changedBy);
            }

            return mapToResponse(savedTask);

        } catch (ObjectOptimisticLockingFailureException e) {
            throw new ConflictException("Task was modified by another user. Please refresh and try again.");
        }
    }

    @Transactional
    public void deleteTask(UUID taskId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Task task = getTaskOrThrow(taskId);

        if (!task.getProject().getOwner().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("Only the project owner can delete tasks");
        }

        task.setDeleted(true);
        task.setUpdatedBy(currentUserId);
        taskRepository.save(task);

        log.info("Task '{}' soft-deleted by user {}", task.getTitle(), currentUserId);
    }

    // ========== Helper Methods ==========

    private Task getTaskOrThrow(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        if (task.isDeleted()) {
            throw new ResourceNotFoundException("Task", "id", taskId);
        }
        return task;
    }

    private void verifyProjectAccess(UUID projectId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        boolean isOwner = project.getOwner().getId().equals(currentUserId);
        Team team = teamRepository.findByProjectId(projectId).orElse(null);
        boolean isMember = team != null && team.getMembers().stream()
                .anyMatch(m -> m.getId().equals(currentUserId));

        if (!isOwner && !isMember) {
            throw new UnauthorizedAccessException("You don't have access to this project");
        }
    }

    private User validateAndGetAssignee(UUID assigneeId, UUID projectId) {
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", assigneeId));

        Team team = teamRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "projectId", projectId));

        boolean isMember = team.getMembers().stream()
                .anyMatch(m -> m.getId().equals(assigneeId));

        if (!isMember) {
            throw new BadRequestException("User is not a member of this project's team");
        }

        return assignee;
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .dueDate(task.getDueDate())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeName(task.getAssignee() != null ? task.getAssignee().getFullName() : null)
                .createdBy(task.getCreatedBy())
                .updatedBy(task.getUpdatedBy())
                .version(task.getVersion())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}