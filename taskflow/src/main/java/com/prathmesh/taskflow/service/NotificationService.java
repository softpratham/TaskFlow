package com.prathmesh.taskflow.service;

import com.prathmesh.taskflow.entity.Notification;
import com.prathmesh.taskflow.entity.Task;
import com.prathmesh.taskflow.entity.User;
import com.prathmesh.taskflow.enums.NotificationType;
import com.prathmesh.taskflow.enums.TaskStatus;
import com.prathmesh.taskflow.dto.response.NotificationResponse;
import com.prathmesh.taskflow.exception.ResourceNotFoundException;
import com.prathmesh.taskflow.repository.NotificationRepository;
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
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public void notifyTaskAssigned(Task task, User assignee, User assigner) {
        if (assignee.getId().equals(assigner.getId())) {
            return;
        }

        String message = "You've been assigned to task '" + task.getTitle() +
                "' in project '" + task.getProject().getName() +
                "' by " + assigner.getFullName();

        createNotification(assignee, message, NotificationType.TASK_ASSIGNED, task.getId());

        try {
            emailService.sendTaskAssignedEmail(
                    assignee.getEmail(),
                    assignee.getFullName(),
                    task.getTitle(),
                    task.getProject().getName(),
                    assigner.getFullName()
            );
        } catch (Exception e) {
            log.error("Failed to send task assigned email: {}", e.getMessage());
        }
    }

    public void notifyStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus, User changedBy) {
        String message = "Task '" + task.getTitle() + "' status changed from " +
                oldStatus + " to " + newStatus + " by " + changedBy.getFullName();

        User projectOwner = task.getProject().getOwner();
        User assignee = task.getAssignee();

        if (!projectOwner.getId().equals(changedBy.getId())) {
            createNotification(projectOwner, message, NotificationType.STATUS_CHANGED, task.getId());
            emailService.sendStatusChangedEmail(
                    projectOwner.getEmail(),
                    projectOwner.getFullName(),
                    task.getTitle(),
                    oldStatus.name(),
                    newStatus.name(),
                    changedBy.getFullName()
            );
        }

        if (assignee != null && !assignee.getId().equals(changedBy.getId())
                && !assignee.getId().equals(projectOwner.getId())) {
            createNotification(assignee, message, NotificationType.STATUS_CHANGED, task.getId());
            emailService.sendStatusChangedEmail(
                    assignee.getEmail(),
                    assignee.getFullName(),
                    task.getTitle(),
                    oldStatus.name(),
                    newStatus.name(),
                    changedBy.getFullName()
            );
        }
    }

    public void notifyCommentAdded(Task task, User commenter, String commentContent) {
        String message = commenter.getFullName() + " commented on task '" + task.getTitle() + "'";
        String commentPreview = commentContent.length() > 100
                ? commentContent.substring(0, 100) + "..."
                : commentContent;

        User projectOwner = task.getProject().getOwner();
        User assignee = task.getAssignee();

        if (assignee != null && !assignee.getId().equals(commenter.getId())) {
            createNotification(assignee, message, NotificationType.COMMENT_ADDED, task.getId());
            emailService.sendCommentAddedEmail(
                    assignee.getEmail(),
                    assignee.getFullName(),
                    task.getTitle(),
                    commenter.getFullName(),
                    commentPreview
            );
        }

        if (!projectOwner.getId().equals(commenter.getId())
                && (assignee == null || !projectOwner.getId().equals(assignee.getId()))) {
            createNotification(projectOwner, message, NotificationType.COMMENT_ADDED, task.getId());
            emailService.sendCommentAddedEmail(
                    projectOwner.getEmail(),
                    projectOwner.getFullName(),
                    task.getTitle(),
                    commenter.getFullName(),
                    commentPreview
            );
        }
    }

    public List<NotificationResponse> getMyNotifications() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUserId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<NotificationResponse> getMyUnreadNotifications() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(currentUserId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public long getUnreadCount() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        return notificationRepository.countByUserIdAndIsReadFalse(currentUserId);
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Notification", "id", notificationId);
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(currentUserId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private void createNotification(User user, String message, NotificationType type, UUID referenceId) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .build();
        notificationRepository.save(notification);
        log.info("Notification created for user {}: {}", user.getEmail(), message);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .read(notification.isRead())
                .taskId(notification.getReferenceId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}