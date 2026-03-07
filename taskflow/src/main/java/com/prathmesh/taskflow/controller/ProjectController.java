package com.prathmesh.taskflow.controller;

import com.prathmesh.taskflow.dto.request.CreateProjectRequest;
import com.prathmesh.taskflow.dto.response.ProjectResponse;
import com.prathmesh.taskflow.service.ProjectService;
import com.prathmesh.taskflow.dto.response.PagedResponse;
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
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project CRUD and search")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectService.getProject(projectId));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getMyProjects() {
        return ResponseEntity.ok(projectService.getMyProjects());
    }

    @GetMapping("/search")
    public ResponseEntity<PagedResponse<ProjectResponse>> searchProjects(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(projectService.searchProjects(search, page, size, sortBy, direction));
    }

    @PatchMapping("/{projectId}/archive")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ProjectResponse> archiveProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectService.archiveProject(projectId));
    }
}