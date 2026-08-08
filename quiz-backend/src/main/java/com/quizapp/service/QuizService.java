package com.quizapp.service;

import com.quizapp.dto.request.CreateOptionRequest;
import com.quizapp.dto.request.CreateQuestionRequest;
import com.quizapp.dto.request.CreateQuizRequest;
import com.quizapp.dto.response.OptionResponse;
import com.quizapp.dto.response.QuestionResponse;
import com.quizapp.dto.response.QuizResponse;
import com.quizapp.entity.Option;
import com.quizapp.entity.Question;
import com.quizapp.entity.Quiz;
import com.quizapp.entity.User;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.exception.UnauthorizedAccessException;
import com.quizapp.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;

    @Transactional
    public QuizResponse createQuiz(CreateQuizRequest request, User currentUser) {
        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(currentUser)
                .questions(new ArrayList<>())
                .build();

        if (request.getQuestions() != null) {
            for (CreateQuestionRequest qDto : request.getQuestions()) {
                Question question = Question.builder()
                        .questionText(qDto.getQuestionText())
                        .imageUrl(qDto.getImageUrl())
                        .timeLimitSeconds(qDto.getTimeLimitSeconds() != null ? qDto.getTimeLimitSeconds() : 20)
                        .points(qDto.getPoints() != null ? qDto.getPoints() : 1000)
                        .options(new ArrayList<>())
                        .build();

                if (qDto.getOptions() != null) {
                    for (CreateOptionRequest oDto : qDto.getOptions()) {
                        Option option = Option.builder()
                                .optionText(oDto.getOptionText())
                                .isCorrect(oDto.getIsCorrect())
                                .build();
                        question.addOption(option);
                    }
                }
                quiz.addQuestion(question);
            }
        }

        Quiz savedQuiz = quizRepository.save(quiz);
        return mapToQuizResponse(savedQuiz);
    }

    @Transactional(readOnly = true)
    public List<QuizResponse> getMyQuizzes(User currentUser) {
        List<Quiz> quizzes = quizRepository.findByCreatedById(currentUser.getId());
        return quizzes.stream()
                .map(this::mapToQuizResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizResponse getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));
        return mapToQuizResponse(quiz);
    }

    @Transactional
    public QuizResponse updateQuiz(Long id, CreateQuizRequest request, User currentUser) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));

        if (!quiz.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException("You are not authorized to update this quiz");
        }

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());

        quiz.getQuestions().clear();

        if (request.getQuestions() != null) {
            for (CreateQuestionRequest qDto : request.getQuestions()) {
                Question question = Question.builder()
                        .questionText(qDto.getQuestionText())
                        .imageUrl(qDto.getImageUrl())
                        .timeLimitSeconds(qDto.getTimeLimitSeconds() != null ? qDto.getTimeLimitSeconds() : 20)
                        .points(qDto.getPoints() != null ? qDto.getPoints() : 1000)
                        .options(new ArrayList<>())
                        .build();

                if (qDto.getOptions() != null) {
                    for (CreateOptionRequest oDto : qDto.getOptions()) {
                        Option option = Option.builder()
                                .optionText(oDto.getOptionText())
                                .isCorrect(oDto.getIsCorrect())
                                .build();
                        question.addOption(option);
                    }
                }
                quiz.addQuestion(question);
            }
        }

        Quiz updatedQuiz = quizRepository.save(quiz);
        return mapToQuizResponse(updatedQuiz);
    }

    @Transactional
    public void deleteQuiz(Long id, User currentUser) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));

        if (!quiz.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException("You are not authorized to delete this quiz");
        }

        quizRepository.delete(quiz);
    }

    public QuizResponse mapToQuizResponse(Quiz quiz) {
        List<QuestionResponse> questionResponses = quiz.getQuestions() != null
                ? quiz.getQuestions().stream().map(this::mapToQuestionResponse).collect(Collectors.toList())
                : List.of();

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .createdById(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getId() : null)
                .createdByUsername(quiz.getCreatedBy() != null ? quiz.getCreatedBy().getUsername() : null)
                .createdAt(quiz.getCreatedAt())
                .questions(questionResponses)
                .build();
    }

    private QuestionResponse mapToQuestionResponse(Question question) {
        List<OptionResponse> optionResponses = question.getOptions() != null
                ? question.getOptions().stream().map(this::mapToOptionResponse).collect(Collectors.toList())
                : List.of();

        return QuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .imageUrl(question.getImageUrl())
                .timeLimitSeconds(question.getTimeLimitSeconds())
                .points(question.getPoints())
                .options(optionResponses)
                .build();
    }

    private OptionResponse mapToOptionResponse(Option option) {
        return OptionResponse.builder()
                .id(option.getId())
                .optionText(option.getOptionText())
                .isCorrect(option.getIsCorrect())
                .build();
    }
}
