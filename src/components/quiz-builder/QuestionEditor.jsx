import OptionInput from './OptionInput';
import Input from '../common/Input';

export default function QuestionEditor({ question, qIndex, onChange, onRemove }) {
  const handleOptionChange = (oIndex, field, value) => {
    const updatedOptions = [...question.options];
    updatedOptions[oIndex] = { ...updatedOptions[oIndex], [field]: value };
    onChange(qIndex, 'options', updatedOptions);
  };

  return (
    <div className="p-6 bg-turf rounded-xl border border-turf-light mb-6 space-y-4 transition-colors hover:border-turf-light/80">
      <div className="flex justify-between items-center">
        <h4 className="font-display font-bold text-lg text-chalk">
          QUESTION {qIndex + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(qIndex)}
          className="text-coral hover:text-coral/80 text-sm font-semibold transition-all hover:-translate-y-px"
        >
          Remove Question
        </button>
      </div>

      <Input
        label="Question Text"
        required
        value={question.question_text}
        onChange={(e) => onChange(qIndex, 'question_text', e.target.value)}
        placeholder="What is the capital of France?"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Time Limit (s)"
          type="number"
          min="5"
          max="120"
          value={question.time_limit_seconds}
          onChange={(e) => onChange(qIndex, 'time_limit_seconds', parseInt(e.target.value) || 20)}
          fieldClassName="font-mono"
        />
        <Input
          label="Points"
          type="number"
          value={question.points}
          onChange={(e) => onChange(qIndex, 'points', parseInt(e.target.value) || 1000)}
          fieldClassName="font-mono"
        />
      </div>

      <div className="space-y-3 pt-2">
        <label className="block font-doodle text-base text-amber/90">
          Options — tick the box next to the correct answer
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
