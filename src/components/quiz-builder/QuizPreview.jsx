import QuestionCard from '../game/QuestionCard';
import AnswerButton from '../game/AnswerButton';

// Shows a builder question exactly as it will look in a live game, so hosts
// can catch a too-long question or a missing correct answer before hosting.
export default function QuizPreview({ question, index, total }) {
  const shaped = {
    questionIndex: index,
    totalQuestions: total,
    text: question.questionText || 'Your question appears here',
    imageUrl: question.imageUrl,
    points: question.points || 1000,
  };
  return (
    <div className="rounded-xl border-2 border-dashed border-turf-light bg-pitch p-4 sm:p-5">
      <p className="font-doodle text-base text-chalk-dim mb-4">
        What players see — {question.timeLimitSeconds || 20} seconds on the clock. The ringed tile is the correct answer.
      </p>
      <QuestionCard question={shaped} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        {question.options.map((option, i) => (
          <AnswerButton
            key={i}
            index={i}
            text={option.optionText || `Option ${i + 1}`}
            state={option.isCorrect ? 'correct' : 'idle'}
          />
        ))}
      </div>
    </div>
  );
}