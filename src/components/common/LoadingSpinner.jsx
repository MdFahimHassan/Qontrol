// Hand-drawn spinner — an imperfect, slightly-open circle (same wobble
// language as Scribble.jsx) spinning continuously, instead of a generic
// stock circular loader. Uses currentColor so it inherits whatever text
// color the parent sets (pitch on an amber button, chalk-dim inline, etc).
export default function LoadingSpinner({ size = 24, label = 'Loading', className = '' }) {
  return (
    <span role="status" aria-label={label} className={`inline-flex ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        className="animate-doodle-spin"
        aria-hidden="true"
      >
        <path
          d="M23 4C12 3 4 12 5 23C6 34 16 41 25 39C34 37 40 29 38 20"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
