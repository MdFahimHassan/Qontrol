import OptionInput from './OptionInput';

export default function QuestionEditor({ question, qIndex, onChange, onRemove }) {
  const handleOptionChange = (oIndex, field, value) => {
    const updatedOptions = [...question.options];
    updatedOptions[oIndex] = { ...updatedOptions[oIndex], [field]: value };
    onChange(qIndex, 'options', updatedOptions);
  };

  return (
    <div className="p-6 bg-turf rounded-xl border border-turf-light mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-display font-bold text-lg text-chalk">
          QUESTION {qIndex + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(qIndex)}
          className="text-coral hover:text-coral/80 text-sm font-semibold transition-colors"
        >
          Remove Question
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-chalk-dim mb-1">Question Text</label>
        <input
          type="text"
          required
          value={question.question_text}
          onChange={(e) => onChange(qIndex, 'question_text', e.target.value)}
          placeholder="What is the capital of France?"
          className="w-full px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk focus:ring-2 focus:ring-amber outline-none transition-shadow"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-chalk-dim mb-1">Time Limit (s)</label>
          <input
            type="number"
            min="5"
            max="120"
            value={question.time_limit_seconds}
            onChange={(e) => onChange(qIndex, 'time_limit_seconds', parseInt(e.target.value) || 20)}
            className="w-full px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk font-mono focus:ring-2 focus:ring-amber outline-none transition-shadow"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-chalk-dim mb-1">Points</label>
          <input
            type="number"
            value={question.points}
            onChange={(e) => onChange(qIndex, 'points', parseInt(e.target.value) || 1000)}
            className="w-full px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk font-mono focus:ring-2 focus:ring-amber outline-none transition-shadow"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="block text-sm font-medium text-chalk-dim">
          Options (Check the box next to the correct answer)
        </label>
        {question.options.map((option, oIndex) => (
          <OptionInput
            key={oIndex}
            index={oIndex}
            option={option}
            onChange={handleOptionChange}
          />
        ))}
      </div>
    </div>
  );
}