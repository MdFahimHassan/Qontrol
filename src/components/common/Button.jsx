import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

// Shared button — every CTA in the app (landing, auth, dashboard, quiz
// builder) was hand-copying these classes with tiny drift between pages.
// One component, one hover/active/disabled language.
const VARIANTS = {
  primary:
    'text-pitch bg-amber hover:bg-amber-dim hover:-rotate-1 shadow-[0_0_24px_-6px_rgba(255,182,39,0.5)]',
  ghost:
    'text-chalk bg-turf border border-turf-light hover:bg-turf-light hover:rotate-1',
  danger:
    'text-coral bg-coral/10 border border-coral/30 hover:bg-coral/20',
  dashed:
    'text-chalk-dim bg-turf border-2 border-dashed border-turf-light hover:border-cyan hover:text-cyan',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'py-4 px-6 text-lg',
};

export default function Button({
  to,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 font-display font-bold rounded-lg transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:hover:rotate-0 disabled:hover:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <LoadingSpinner size={16} />}
      {children}
    </button>
  );
}
