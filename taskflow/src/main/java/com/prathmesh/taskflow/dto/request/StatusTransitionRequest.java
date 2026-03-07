package com.prathmesh.taskflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusTransitionRequest {

    @NotBlank(message = "Target status is required")
    private String status;  // "TODO", "IN_PROGRESS", "BLOCKED", "DONE"
}