import { useId } from 'react';

// Shared field — replaces the copy-pasted <input> blocks in Login, Register,
// QuizBuilder and QuestionEditor. Adds a hand-drawn marker underline that
// "draws" in on focus (mirrors Scribble.jsx's stroke-dashoffset trick) in
// place of the flat default focus ring, and a consistent error state.
export default function Input({
  label,
  error,
  as = 'input',
  className = '',
  fieldClassName = '',
  ...props
}) {
  const id = useId();
  const Field = as;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-chalk-dim mb-1">
          {label}
        </label>
      )}
      <div className="group relative">
        <Field
          id={id}
          className={`w-full px-4 py-2 bg-pitch border rounded-lg text-chalk outline-none transition-colors ${
            error ? 'border-coral' : 'border-turf-light focus:border-amber'
          } ${as === 'textarea' ? 'h-24 resize-none' : ''} ${fieldClassName}`}
          {...props}
        />
        {!error && (
          <svg
            viewBox="0 0 100 6"
            preserveAspectRatio="none"
            className="absolute left-2 right-2 -bottom-[3px] h-[6px] pointer-events-none"
            aria-hidden="true"
          >
            <path
              d="M2 3C20 1 50 1 98 3"
              fill="none"
              stroke="var(--color-amber)"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength={100}
              className="focus-underline-path"
            />
          </svg>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-coral">{error}</p>}
    </div>
  );
}
