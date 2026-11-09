package com.quizapp.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Max;
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
    @Size(max = 500, message = "Question text must be at most 500 characters")
    private String questionText;

    @Size(max = 255, message = "Image URL must be at most 255 characters")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "Image URL must start with http:// or https://")
    private String imageUrl;

    @Builder.Default
    @Min(value = 5, message = "Time limit must be at least 5 seconds")
    @Max(value = 120, message = "Time limit can be at most 120 seconds")
    private Integer timeLimitSeconds = 20;

    @Builder.Default
    @Min(value = 0, message = "Points must be positive or zero")
    @Max(value = 100000, message = "Points can be at most 100000")
    private Integer points = 1000;

    @Valid
    @NotEmpty(message = "Question must have at least one option")
    @Size(min = 2, max = 6, message = "Each question needs between 2 and 6 options")
    private List<CreateOptionRequest> options;
}