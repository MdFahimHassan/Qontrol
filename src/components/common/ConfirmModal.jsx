import { useEffect } from 'react';
import Button from './Button';

// Replaces window.confirm()/alert() (used in DashboardPage and
// QuizBuilderPage) with a dialog that actually looks like the rest of the
// app instead of breaking immersion with native OS chrome.
export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onCancel?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-pitch/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm p-6 bg-turf border border-turf-light rounded-xl shadow-2xl -rotate-1 animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="font-display font-bold text-xl text-chalk mb-2">
          {title}
        </h3>
        {message && <p className="text-chalk-dim text-sm mb-6">{message}</p>}
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
