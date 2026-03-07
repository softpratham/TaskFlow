package com.prathmesh.taskflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {

    private UUID id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;

    private UUID projectId;
    private String projectName;

    private UUID assigneeId;
    private String assigneeName;

    private UUID createdBy;
    private UUID updatedBy;
    private Long version;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}