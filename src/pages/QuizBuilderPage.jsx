import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizService } from '../services/quizService';
import QuestionEditor from '../components/quiz-builder/QuestionEditor';

export default function QuizBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      quizService.getQuizById(id).then((data) => {
        setTitle(data.title);
        setDescription(data.description || '');
        setQuestions(data.questions || []);
      }).catch(() => alert('Failed to fetch quiz details'));
    }
  }, [id]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        time_limit_seconds: 20,
        points: 1000,
        options: [
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
        ],
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }

    setLoading(true);
    const quizPayload = { title, description, questions };

    try {
      if (id) {
        await quizService.updateQuiz(id, quizPayload);
      } else {
        await quizService.createQuiz(quizPayload);
      }
      navigate('/dashboard');
    } catch (err) {
      alert('Error saving quiz. Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pitch p-6 text-chalk">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-6">
          {id ? 'EDIT QUIZ' : 'CREATE NEW QUIZ'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-turf rounded-xl border border-turf-light space-y-4">
            <div>
              <label className="block text-sm font-medium text-chalk-dim mb-1">Quiz Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="General Knowledge Master Quiz"
                className="w-full px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk focus:ring-2 focus:ring-amber outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-chalk-dim mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your quiz..."
                className="w-full px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk focus:ring-2 focus:ring-amber outline-none transition-shadow h-24"
              />
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl mb-4">QUESTIONS</h3>
            {questions.map((q, index) => (
              <QuestionEditor
                key={index}
                qIndex={index}
                question={q}
                onChange={handleQuestionChange}
                onRemove={handleRemoveQuestion}
              />
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-3 bg-turf border-2 border-dashed border-turf-light text-chalk-dim font-semibold rounded-xl hover:border-cyan hover:text-cyan transition-colors"
            >
              + Add Question
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-amber hover:bg-amber-dim text-pitch font-display font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'SAVING…' : id ? 'UPDATE QUIZ' : 'SAVE QUIZ'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-turf border border-turf-light hover:bg-turf-light text-chalk-dim rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}