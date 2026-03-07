package com.prathmesh.taskflow.service;

import com.prathmesh.taskflow.dto.request.LoginRequest;
import com.prathmesh.taskflow.dto.request.RegisterRequest;
import com.prathmesh.taskflow.dto.response.AuthResponse;
import com.prathmesh.taskflow.entity.User;
import com.prathmesh.taskflow.enums.Role;
import com.prathmesh.taskflow.exception.BadRequestException;
import com.prathmesh.taskflow.exception.DuplicateResourceException;
import com.prathmesh.taskflow.repository.UserRepository;
import com.prathmesh.taskflow.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        // Parse and validate role
        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole() + ". Must be MANAGER or TEAM_MEMBER");
        }

        // Create user
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered: {} with role {}", savedUser.getEmail(), savedUser.getRole());

        // Generate token
        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());

        return buildAuthResponse(savedUser, token);
    }

    public AuthResponse login(LoginRequest request) {
        // Find user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        log.info("User logged in: {}", user.getEmail());

        // Generate token
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .token(token)
                .build();
    }
}