package com.prathmesh.taskflow.service;

import com.prathmesh.taskflow.dto.response.DashboardResponse;
import com.prathmesh.taskflow.entity.Project;
import com.prathmesh.taskflow.entity.Task;
import com.prathmesh.taskflow.entity.Team;
import com.prathmesh.taskflow.enums.TaskStatus;
import com.prathmesh.taskflow.exception.ResourceNotFoundException;
import com.prathmesh.taskflow.exception.UnauthorizedAccessException;
import com.prathmesh.taskflow.repository.ProjectRepository;
import com.prathmesh.taskflow.repository.TaskRepository;
import com.prathmesh.taskflow.repository.TeamRepository;
import com.prathmesh.taskflow.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;

    public DashboardResponse getProjectDashboard(UUID projectId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        // Verify access
        boolean isOwner = project.getOwner().getId().equals(currentUserId);
        Team team = teamRepository.findByProjectId(projectId).orElse(null);
        boolean isMember = team != null && team.getMembers().stream()
                .anyMatch(m -> m.getId().equals(currentUserId));

        if (!isOwner && !isMember) {
            throw new UnauthorizedAccessException("You don't have access to this project");
        }

        // Get all non-deleted tasks
        List<Task> tasks = taskRepository.findByProjectIdAndDeletedFalse(projectId);

        // Status counts
        Map<String, Long> statusMap = new LinkedHashMap<>();
        statusMap.put("TODO", tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count());
        statusMap.put("IN_PROGRESS", tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
        statusMap.put("BLOCKED", tasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count());
        statusMap.put("DONE", tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count());

        // Priority counts
        Map<String, Long> priorityMap = new LinkedHashMap<>();
        priorityMap.put("LOW", tasks.stream().filter(t -> t.getPriority().name().equals("LOW")).count());
        priorityMap.put("MEDIUM", tasks.stream().filter(t -> t.getPriority().name().equals("MEDIUM")).count());
        priorityMap.put("HIGH", tasks.stream().filter(t -> t.getPriority().name().equals("HIGH")).count());
        priorityMap.put("URGENT", tasks.stream().filter(t -> t.getPriority().name().equals("URGENT")).count());

        // Overdue tasks
        long overdue = tasks.stream()
                .filter(t -> t.getDueDate() != null
                        && t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != TaskStatus.DONE)
                .count();

        // Completion percentage
        long total = tasks.size();
        long done = statusMap.get("DONE");
        double completion = total > 0 ? (done * 100.0 / total) : 0;

        return DashboardResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .totalTasks(total)
                .tasksByStatus(statusMap)
                .tasksByPriority(priorityMap)
                .overdueTasks(overdue)
                .completionPercentage(completion)
                .teamSize(team != null ? team.getMembers().size() : 0)
                .build();
    }
}