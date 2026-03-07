package com.prathmesh.taskflow.controller;

import com.prathmesh.taskflow.dto.request.CreateTaskRequest;
import com.prathmesh.taskflow.dto.request.StatusTransitionRequest;
import com.prathmesh.taskflow.dto.request.UpdateTaskRequest;
import com.prathmesh.taskflow.dto.response.TaskResponse;
import com.prathmesh.taskflow.service.TaskService;
import com.prathmesh.taskflow.dto.response.PagedResponse;
import com.prathmesh.taskflow.enums.Priority;
import com.prathmesh.taskflow.enums.TaskStatus;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management, status transitions, search & pagination")
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(projectId, request));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable UUID taskId) {
        return ResponseEntity.ok(taskService.getTask(taskId));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID assigneeId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, status, assigneeId));
    }

    @GetMapping("/tasks/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        return ResponseEntity.ok(taskService.getMyTasks());
    }

    @GetMapping("/projects/{projectId}/tasks/paginated")
    public ResponseEntity<PagedResponse<TaskResponse>> getTasksPaginated(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(taskService.getTasksPaginated(projectId, page, size, sortBy, direction));
    }

    @GetMapping("/projects/{projectId}/tasks/search")
    public ResponseEntity<PagedResponse<TaskResponse>> searchTasks(
            @PathVariable UUID projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(taskService.searchTasks(projectId, status, priority, assigneeId, search,
                page, size, sortBy, direction));
    }

    @PutMapping("/tasks/{taskId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }

    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<TaskResponse> transitionStatus(
            @PathVariable UUID taskId,
            @Valid @RequestBody StatusTransitionRequest request) {
        return ResponseEntity.ok(taskService.transitionStatus(taskId, request));
    }

    @DeleteMapping("/tasks/{taskId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}