package com.quizapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOptionRequest {

    private Long id;

    @NotBlank(message = "Option text is required")
    private String optionText;

    @NotNull(message = "isCorrect boolean flag is required")
    private Boolean isCorrect;
}
