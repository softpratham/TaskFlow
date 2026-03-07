package com.prathmesh.taskflow.controller;

import com.prathmesh.taskflow.dto.response.DashboardResponse;
import com.prathmesh.taskflow.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Project statistics and overview")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable UUID projectId) {
        return ResponseEntity.ok(dashboardService.getProjectDashboard(projectId));
    }
}