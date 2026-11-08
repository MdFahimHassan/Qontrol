import Input from '../common/Input';

// Radio (not checkbox): a question has exactly one correct option.
export default function OptionInput({ index, option, groupName, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="radio"
        name={groupName}
        checked={option.isCorrect}
        onChange={() => onChange(index, 'isCorrect', true)}
        aria-label={`Mark option ${index + 1} as the correct answer`}
        className="w-5 h-5 accent-cyan cursor-pointer"
      />
      <Input
        required
        value={option.optionText}
        onChange={(e) => onChange(index, 'optionText', e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="flex-1"
      />
    </div>
  );
}