package com.prathmesh.taskflow.service;

import com.prathmesh.taskflow.dto.response.TeamResponse;
import com.prathmesh.taskflow.entity.Project;
import com.prathmesh.taskflow.entity.Team;
import com.prathmesh.taskflow.entity.User;
import com.prathmesh.taskflow.enums.Role;
import com.prathmesh.taskflow.exception.BadRequestException;
import com.prathmesh.taskflow.exception.ResourceNotFoundException;
import com.prathmesh.taskflow.exception.UnauthorizedAccessException;
import com.prathmesh.taskflow.repository.TeamRepository;
import com.prathmesh.taskflow.repository.UserRepository;
import com.prathmesh.taskflow.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public TeamResponse getTeamByProject(UUID projectId) {
        Team team = teamRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "projectId", projectId));

        // Verify access
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        boolean isOwner = team.getProject().getOwner().getId().equals(currentUserId);
        boolean isMember = team.getMembers().stream()
                .anyMatch(m -> m.getId().equals(currentUserId));

        if (!isOwner && !isMember) {
            throw new UnauthorizedAccessException("You don't have access to this team");
        }

        return mapToResponse(team);
    }

    @Transactional
    public TeamResponse addMember(UUID projectId, String email) {
        Team team = teamRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "projectId", projectId));

        // Only project owner (MANAGER) can add members
        verifyProjectOwner(team);

        User newMember = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Must be a TEAM_MEMBER role
        if (newMember.getRole() != Role.TEAM_MEMBER) {
            throw new BadRequestException("Only users with TEAM_MEMBER role can be added to teams");
        }

        // Check if already a member
        boolean alreadyMember = team.getMembers().stream()
                .anyMatch(m -> m.getId().equals(newMember.getId()));
        if (alreadyMember) {
            throw new BadRequestException("User is already a member of this team");
        }

        team.getMembers().add(newMember);
        Team savedTeam = teamRepository.save(team);

        log.info("User '{}' added to team for project {}", email, projectId);

        return mapToResponse(savedTeam);
    }

    @Transactional
    public TeamResponse removeMember(UUID projectId, UUID userId) {
        Team team = teamRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "projectId", projectId));

        // Only project owner can remove members
        verifyProjectOwner(team);

        // Can't remove the project owner
        if (team.getProject().getOwner().getId().equals(userId)) {
            throw new BadRequestException("Cannot remove the project owner from the team");
        }

        boolean removed = team.getMembers().removeIf(m -> m.getId().equals(userId));
        if (!removed) {
            throw new ResourceNotFoundException("User", "id", userId);
        }

        Team savedTeam = teamRepository.save(team);

        log.info("User {} removed from team for project {}", userId, projectId);

        return mapToResponse(savedTeam);
    }

    private void verifyProjectOwner(Team team) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Project project = team.getProject();
        if (!project.getOwner().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("Only the project owner can manage team members");
        }
    }

    private TeamResponse mapToResponse(Team team) {
        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .projectId(team.getProject().getId())
                .projectName(team.getProject().getName())
                .members(team.getMembers().stream()
                        .map(user -> TeamResponse.MemberInfo.builder()
                                .userId(user.getId())
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}