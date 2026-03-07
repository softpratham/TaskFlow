package com.prathmesh.taskflow.controller;

import com.prathmesh.taskflow.dto.request.CreateCommentRequest;
import com.prathmesh.taskflow.dto.response.CommentResponse;
import com.prathmesh.taskflow.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.addComment(taskId, request));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable UUID taskId) {
        return ResponseEntity.ok(commentService.getCommentsByTask(taskId));
    }
}