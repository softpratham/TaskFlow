package com.prathmesh.taskflow.entity;

import com.prathmesh.taskflow.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    @OneToMany(mappedBy = "owner", fetch = FetchType.LAZY)
    private List<Project> ownedProjects = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "assignee", fetch = FetchType.LAZY)
    private List<Task> assignedTasks = new ArrayList<>();

    @Builder.Default
    @ManyToMany(mappedBy = "members", fetch = FetchType.LAZY)
    private List<Team> teams = new ArrayList<>();
}