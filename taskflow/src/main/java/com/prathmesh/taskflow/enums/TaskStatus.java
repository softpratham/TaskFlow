package com.prathmesh.taskflow.enums;

import java.util.Map;
import java.util.Set;

public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    BLOCKED,
    DONE;

    private static final Map<TaskStatus, Set<TaskStatus>> VALID_TRANSITIONS = Map.of(
            TODO, Set.of(IN_PROGRESS),
            IN_PROGRESS, Set.of(BLOCKED, DONE),
            BLOCKED, Set.of(IN_PROGRESS),
            DONE, Set.of()
    );

    public boolean canTransitionTo(TaskStatus target) {
        return VALID_TRANSITIONS.getOrDefault(this, Set.of()).contains(target);
    }
}