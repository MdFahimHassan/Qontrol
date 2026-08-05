export default function OptionInput({ index, option, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={option.is_correct}
        onChange={(e) => onChange(index, 'is_correct', e.target.checked)}
        className="w-5 h-5 accent-cyan rounded cursor-pointer"
      />
      <input
        type="text"
        required
        value={option.option_text}
        onChange={(e) => onChange(index, 'option_text', e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="flex-1 px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk focus:ring-2 focus:ring-amber outline-none transition-shadow"
      />
    </div>
  );
}