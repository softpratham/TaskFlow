package com.prathmesh.taskflow.controller;

import com.prathmesh.taskflow.dto.request.AddMemberRequest;
import com.prathmesh.taskflow.dto.response.TeamResponse;
import com.prathmesh.taskflow.service.TeamService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/team")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team member management")
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<TeamResponse> getTeam(@PathVariable UUID projectId) {
        return ResponseEntity.ok(teamService.getTeamByProject(projectId));
    }

    @PostMapping("/members")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TeamResponse> addMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.ok(teamService.addMember(projectId, request.getEmail()));
    }

    @DeleteMapping("/members/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<TeamResponse> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId) {
        return ResponseEntity.ok(teamService.removeMember(projectId, userId));
    }
}