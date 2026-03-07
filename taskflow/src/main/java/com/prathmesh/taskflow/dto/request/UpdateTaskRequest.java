package com.prathmesh.taskflow.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {

    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private String priority;

    private LocalDate dueDate;

    private UUID assigneeId;
}