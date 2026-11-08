import { formatScore } from '../../utils/scoring';

// The question itself. `size="lg"` is for the host's big screen, "md" for phones.
export default function QuestionCard({ question, size = 'md', className = '' }) {
  const { questionIndex, totalQuestions, text, imageUrl, points } = question;
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-doodle text-lg text-amber">
          Question {questionIndex + 1} of {totalQuestions}
        </p>
        <span className="font-mono text-sm text-chalk-dim border border-turf-light rounded-full px-3 py-1">
          {formatScore(points)} pts
        </span>
      </div>
      <h2
        className={`font-display font-bold text-chalk leading-tight break-words ${
          size === 'lg' ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-2xl'
        }`}
      >
        {text}
      </h2>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="mt-4 mx-auto max-h-56 rounded-xl border border-turf-light object-contain"
        />
      )}
    </div>
  );
}