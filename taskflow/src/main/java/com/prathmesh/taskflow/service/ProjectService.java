package com.prathmesh.taskflow.service;

import com.prathmesh.taskflow.dto.request.CreateProjectRequest;
import com.prathmesh.taskflow.dto.response.PagedResponse;
import com.prathmesh.taskflow.dto.response.ProjectResponse;
import com.prathmesh.taskflow.entity.Project;
import com.prathmesh.taskflow.entity.Team;
import com.prathmesh.taskflow.entity.User;
import com.prathmesh.taskflow.exception.ResourceNotFoundException;
import com.prathmesh.taskflow.exception.UnauthorizedAccessException;
import com.prathmesh.taskflow.repository.ProjectRepository;
import com.prathmesh.taskflow.repository.TeamRepository;
import com.prathmesh.taskflow.repository.UserRepository;
import com.prathmesh.taskflow.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        User owner = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();
        Project savedProject = projectRepository.save(project);

        Team team = Team.builder()
                .name(request.getName() + " Team")
                .project(savedProject)
                .members(new ArrayList<>())
                .build();
        team.getMembers().add(owner);
        Team savedTeam = teamRepository.save(team);

        log.info("Project '{}' created by user {} with team {}", savedProject.getName(), currentUserId, savedTeam.getId());

        return mapToResponse(savedProject, savedTeam);
    }

    public ProjectResponse getProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        Team team = teamRepository.findByProjectId(projectId).orElse(null);

        UUID currentUserId = SecurityUtil.getCurrentUserId();
        boolean isOwner = project.getOwner().getId().equals(currentUserId);
        boolean isMember = team != null && team.getMembers().stream()
                .anyMatch(m -> m.getId().equals(currentUserId));

        if (!isOwner && !isMember) {
            throw new UnauthorizedAccessException("You don't have access to this project");
        }

        return mapToResponse(project, team);
    }

    public List<ProjectResponse> getMyProjects() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        List<Project> ownedProjects = projectRepository.findByOwnerIdAndArchivedFalse(currentUserId);

        List<Project> memberProjects = user.getTeams().stream()
                .map(Team::getProject)
                .filter(p -> !p.isArchived())
                .collect(Collectors.toList());

        List<Project> allProjects = new ArrayList<>(ownedProjects);
        memberProjects.stream()
                .filter(p -> allProjects.stream().noneMatch(op -> op.getId().equals(p.getId())))
                .forEach(allProjects::add);

        return allProjects.stream()
                .map(p -> {
                    Team team = teamRepository.findByProjectId(p.getId()).orElse(null);
                    return mapToResponse(p, team);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse archiveProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        UUID currentUserId = SecurityUtil.getCurrentUserId();
        if (!project.getOwner().getId().equals(currentUserId)) {
            throw new UnauthorizedAccessException("Only the project owner can archive this project");
        }

        project.setArchived(true);
        Project saved = projectRepository.save(project);
        Team team = teamRepository.findByProjectId(projectId).orElse(null);

        log.info("Project '{}' archived by user {}", project.getName(), currentUserId);

        return mapToResponse(saved, team);
    }

    // ===== Search Projects =====

    public PagedResponse<ProjectResponse> searchProjects(String search, int page, int size,
                                                         String sortBy, String direction) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Project> projectPage = projectRepository.searchProjects(currentUserId, search, pageable);
        Page<ProjectResponse> responsePage = projectPage.map(project -> {
            Team team = teamRepository.findByProjectId(project.getId()).orElse(null);
            return mapToResponse(project, team);
        });

        return PagedResponse.of(responsePage);
    }

    private ProjectResponse mapToResponse(Project project, Team team) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .archived(project.isArchived())
                .ownerId(project.getOwner().getId())
                .ownerName(project.getOwner().getFullName())
                .teamId(team != null ? team.getId() : null)
                .memberCount(team != null ? team.getMembers().size() : 0)
                .createdAt(project.getCreatedAt())
                .build();
    }
}