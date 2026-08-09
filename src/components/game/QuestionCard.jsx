const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Plain-text question display for milestone 2 — one card, a lettered list
// of options, an amber highlight on selection. The countdown ring and
// colored Kahoot-style tiles are milestone 3 polish (see CountdownRing.jsx
// and AnswerButton.jsx); this component is written so those can slot in
// later without changing how host/player pages call it.
//
// Field names are read defensively (camelCase or snake_case) since the
// exact WebSocket DTO shape is the backend dev's call.
export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  interactive = false,
  selectedIndex = null,
  locked = false,
  onSelect,
}) {
  if (!question) return null;

  const text = question.questionText ?? question.question_text ?? '';
  const options = question.options ?? [];

  return (
    <div className="w-full max-w-2xl bg-turf border border-turf-light rounded-xl p-6 sm:p-8 animate-rise-in">
      {(questionNumber || totalQuestions) && (
        <p className="font-mono text-xs tracking-widest text-chalk-dim mb-3">
          QUESTION {questionNumber ?? '?'}
          {totalQuestions ? ` / ${totalQuestions}` : ''}
        </p>
      )}

      <h2 className="font-display font-bold text-2xl sm:text-3xl text-chalk mb-6">{text}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const label = opt.optionText ?? opt.option_text ?? opt.text ?? String(opt);
          const isSelected = selectedIndex === i;
          const disabled = !interactive || locked;

          return (
            <button
              key={opt.id ?? i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(i, opt)}
              className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-amber/15 border-amber text-chalk'
                  : 'bg-pitch border-turf-light text-chalk-dim hover:border-cyan/50 hover:text-chalk'
              } ${interactive && !locked ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${
                disabled && !isSelected ? 'opacity-70' : ''
              }`}
            >
              <span className="font-mono text-xs font-bold w-6 h-6 flex items-center justify-center rounded border border-current shrink-0">
                {OPTION_LETTERS[i] ?? i + 1}
              </span>
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      {interactive && locked && (
        <p className="mt-5 font-doodle text-cyan text-sm">
          Answer locked in — waiting for the host…
        </p>
      )}
    </div>
  );
}
