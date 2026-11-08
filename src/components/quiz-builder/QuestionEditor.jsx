import { useState } from 'react';
import OptionInput from './OptionInput';
import QuizPreview from './QuizPreview';
import Input from '../common/Input';

export default function QuestionEditor({ question, qIndex, total = 1, onChange, onRemove }) {
  const [showPreview, setShowPreview] = useState(false);

  const handleOptionChange = (oIndex, field, value) => {
    const updatedOptions = question.options.map((opt, i) => {
      if (i === oIndex) return { ...opt, [field]: value };
      // Selecting a correct answer deselects every other option.
      if (field === 'isCorrect' && value) return { ...opt, isCorrect: false };
      return opt;
    });
    onChange(qIndex, 'options', updatedOptions);
  };

  return (
    <div className="p-6 bg-turf rounded-xl border border-turf-light mb-6 space-y-4 transition-colors hover:border-turf-light/80">
      <div className="flex justify-between items-center">
        <h4 className="font-display font-bold text-lg text-chalk">
          QUESTION {qIndex + 1}
        </h4>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            aria-expanded={showPreview}
            className="text-cyan hover:text-cyan/80 text-sm font-semibold transition-all hover:-translate-y-px"
          >
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => onRemove(qIndex)}
            className="text-coral hover:text-coral/80 text-sm font-semibold transition-all hover:-translate-y-px"
          >
            Remove Question
          </button>
        </div>
      </div>

      <Input
        label="Question Text"
        required
        value={question.questionText}
        onChange={(e) => onChange(qIndex, 'questionText', e.target.value)}
        placeholder="What is the capital of France?"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Time Limit (s)"
          type="number"
          min="5"
          max="120"
          value={question.timeLimitSeconds}
          onChange={(e) => onChange(qIndex, 'timeLimitSeconds', parseInt(e.target.value) || 20)}
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
          Options — select the correct answer
        </label>
        {question.options.map((option, oIndex) => (
          <OptionInput
            key={oIndex}
            index={oIndex}
            option={option}
            groupName={`correct-${qIndex}`}
            onChange={handleOptionChange}
          />
        ))}
      </div>

      {showPreview && <QuizPreview question={question} index={qIndex} total={total} />}
    </div>
  );
}