package com.quizapp.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
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
public class CreateQuestionRequest {

    private Long id;

    @NotBlank(message = "Question text is required")
    private String questionText;

    private String imageUrl;

    @Builder.Default
    @Min(value = 1, message = "Time limit must be at least 1 second")
    private Integer timeLimitSeconds = 20;

    @Builder.Default
    @Min(value = 0, message = "Points must be positive or zero")
    private Integer points = 1000;

    @Valid
    @NotEmpty(message = "Question must have at least one option")
    private List<CreateOptionRequest> options;
}
