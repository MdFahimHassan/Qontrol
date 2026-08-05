package com.quizapp.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateQuizRequest {

    @NotBlank(message = "Quiz title is required")
    private String title;

    private String description;

    @Valid
    @NotEmpty(message = "Quiz must contain at least one question")
    private List<CreateQuestionRequest> questions;
}
