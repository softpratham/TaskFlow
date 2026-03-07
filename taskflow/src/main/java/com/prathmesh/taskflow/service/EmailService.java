package com.prathmesh.taskflow.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;
    

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    public void sendEmail(String to, String subject, String htmlBody) {
        if (!emailEnabled) {
            log.info("Email disabled. Skipping email to: {} | Subject: {}", to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            mailSender.send(message);
            log.info("Email sent to: {} | Subject: {}", to, subject);

        } catch (MessagingException | MailException e) {
            log.error("Failed to send email to: {} | Subject: {} | Error: {}", to, subject, e.getMessage());
        }
    }

    // ===== Email Templates =====

    @Async
    public void sendTaskAssignedEmail(String toEmail, String assigneeName, String taskTitle,
                                      String projectName, String assignerName) {
        String subject = "TaskFlow: You've been assigned to '" + taskTitle + "'";
        String body = buildEmailTemplate(
                "New Task Assignment",
                "Hi " + assigneeName + ",",
                "<p>You have been assigned to a new task:</p>" +
                        "<table style='border-collapse:collapse; margin:16px 0;'>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Task</td>" +
                        "<td style='padding:8px 16px;'>" + taskTitle + "</td></tr>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Project</td>" +
                        "<td style='padding:8px 16px;'>" + projectName + "</td></tr>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Assigned by</td>" +
                        "<td style='padding:8px 16px;'>" + assignerName + "</td></tr>" +
                        "</table>" +
                        "<p>Log in to TaskFlow to view the task details and get started.</p>"
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendStatusChangedEmail(String toEmail, String recipientName, String taskTitle,
                                       String oldStatus, String newStatus, String changedByName) {
        String subject = "TaskFlow: '" + taskTitle + "' status changed to " + newStatus;
        String body = buildEmailTemplate(
                "Task Status Updated",
                "Hi " + recipientName + ",",
                "<p>A task status has been updated:</p>" +
                        "<table style='border-collapse:collapse; margin:16px 0;'>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Task</td>" +
                        "<td style='padding:8px 16px;'>" + taskTitle + "</td></tr>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Status</td>" +
                        "<td style='padding:8px 16px;'>" +
                        "<span style='text-decoration:line-through; color:#999;'>" + oldStatus + "</span>" +
                        " → <strong style='color:#2563eb;'>" + newStatus + "</strong></td></tr>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Changed by</td>" +
                        "<td style='padding:8px 16px;'>" + changedByName + "</td></tr>" +
                        "</table>"
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendCommentAddedEmail(String toEmail, String recipientName, String taskTitle,
                                      String commenterName, String commentPreview) {
        String subject = "TaskFlow: New comment on '" + taskTitle + "'";
        String body = buildEmailTemplate(
                "New Comment",
                "Hi " + recipientName + ",",
                "<p><strong>" + commenterName + "</strong> commented on task <strong>" + taskTitle + "</strong>:</p>" +
                        "<div style='background:#f1f5f9; border-left:4px solid #2563eb; padding:12px 16px; margin:16px 0; border-radius:4px;'>" +
                        "<em>\"" + commentPreview + "\"</em>" +
                        "</div>" +
                        "<p>Log in to TaskFlow to view the full conversation.</p>"
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendDeadlineReminderEmail(String toEmail, String assigneeName, String taskTitle,
                                          String projectName, String dueDate) {
        String subject = "TaskFlow: '" + taskTitle + "' is due on " + dueDate;
        String body = buildEmailTemplate(
                "⏰ Deadline Reminder",
                "Hi " + assigneeName + ",",
                "<p>This is a reminder that the following task is approaching its deadline:</p>" +
                        "<table style='border-collapse:collapse; margin:16px 0;'>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Task</td>" +
                        "<td style='padding:8px 16px;'>" + taskTitle + "</td></tr>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Project</td>" +
                        "<td style='padding:8px 16px;'>" + projectName + "</td></tr>" +
                        "<tr><td style='padding:8px 16px; font-weight:bold; color:#555;'>Due Date</td>" +
                        "<td style='padding:8px 16px; color:#dc2626; font-weight:bold;'>" + dueDate + "</td></tr>" +
                        "</table>" +
                        "<p>Please ensure the task is completed on time.</p>"
        );
        sendEmail(toEmail, subject, body);
    }

    // ===== HTML Template Builder =====

    private String buildEmailTemplate(String heading, String greeting, String content) {
        return "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'></head>" +
                "<body style='margin:0; padding:0; font-family:Arial,sans-serif; background:#f8fafc;'>" +
                "<div style='max-width:600px; margin:0 auto; padding:20px;'>" +

                // Header
                "<div style='background:linear-gradient(135deg, #1e40af, #3b82f6); padding:24px; border-radius:12px 12px 0 0; text-align:center;'>" +
                "<h1 style='color:white; margin:0; font-size:24px;'>TaskFlow</h1>" +
                "</div>" +

                // Body
                "<div style='background:white; padding:32px; border-radius:0 0 12px 12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);'>" +
                "<h2 style='color:#1e293b; margin-top:0;'>" + heading + "</h2>" +
                "<p style='color:#475569;'>" + greeting + "</p>" +
                "<div style='color:#334155;'>" + content + "</div>" +
                "</div>" +

                // Footer
                "<div style='text-align:center; padding:16px; color:#94a3b8; font-size:12px;'>" +
                "<p>This is an automated notification from TaskFlow.</p>" +
                "</div>" +

                "</div></body></html>";
    }
}