package com.prathmesh.taskflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {

    private UUID id;
    private String name;
    private String description;
    private boolean archived;
    private UUID ownerId;
    private String ownerName;
    private UUID teamId;
    private int memberCount;
    private LocalDateTime createdAt;
}