package com.prathmesh.taskflow.service;

import com.prathmesh.taskflow.dto.request.CreateCommentRequest;
import com.prathmesh.taskflow.dto.response.CommentResponse;
import com.prathmesh.taskflow.entity.Comment;
import com.prathmesh.taskflow.entity.Task;
import com.prathmesh.taskflow.entity.Team;
import com.prathmesh.taskflow.entity.User;
import com.prathmesh.taskflow.exception.ResourceNotFoundException;
import com.prathmesh.taskflow.exception.UnauthorizedAccessException;
import com.prathmesh.taskflow.repository.CommentRepository;
import com.prathmesh.taskflow.repository.TaskRepository;
import com.prathmesh.taskflow.repository.TeamRepository;
import com.prathmesh.taskflow.repository.UserRepository;
import com.prathmesh.taskflow.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final NotificationService notificationService;

    @Transactional
    public CommentResponse addComment(UUID taskId, CreateCommentRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        if (task.isDeleted()) {
            throw new ResourceNotFoundException("Task", "id", taskId);
        }

        // Verify user has access to this project
        verifyProjectAccess(task.getProject().getId(), currentUserId);

        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .task(task)
                .author(author)
                .build();

        Comment savedComment = commentRepository.save(comment);
        log.info("Comment added to task '{}' by user {}", task.getTitle(), currentUserId);
        notificationService.notifyCommentAdded(task, author, request.getContent());
        return mapToResponse(savedComment);
    }

    public List<CommentResponse> getCommentsByTask(UUID taskId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        if (task.isDeleted()) {
            throw new ResourceNotFoundException("Task", "id", taskId);
        }

        // Verify access
        verifyProjectAccess(task.getProject().getId(), currentUserId);

        List<Comment> comments = commentRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
        return comments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void verifyProjectAccess(UUID projectId, UUID userId) {
        Team team = teamRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "projectId", projectId));

        boolean isMember = team.getMembers().stream()
                .anyMatch(m -> m.getId().equals(userId));
        boolean isOwner = team.getProject().getOwner().getId().equals(userId);

        if (!isMember && !isOwner) {
            throw new UnauthorizedAccessException("You don't have access to this project");
        }
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .taskId(comment.getTask().getId())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getFullName())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}