package com.quizapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private Long id;
    private String questionText;
    private String imageUrl;
    private Integer timeLimitSeconds;
    private Integer points;
    private List<OptionResponse> options;
}
