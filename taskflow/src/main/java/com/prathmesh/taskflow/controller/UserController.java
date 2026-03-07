package com.prathmesh.taskflow.controller;

import com.prathmesh.taskflow.dto.request.ChangePasswordRequest;
import com.prathmesh.taskflow.dto.request.UpdateProfileRequest;
import com.prathmesh.taskflow.entity.User;
import com.prathmesh.taskflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "createdAt", user.getCreatedAt()
        ));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.findByEmail(userDetails.getUsername());
        User updated = userService.updateProfile(user.getId(), request.getFullName());
        return ResponseEntity.ok(Map.of(
                "id", updated.getId(),
                "fullName", updated.getFullName(),
                "email", updated.getEmail(),
                "role", updated.getRole().name(),
                "message", "Profile updated successfully"
        ));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        User user = userService.findByEmail(userDetails.getUsername());
        userService.changePassword(user.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}