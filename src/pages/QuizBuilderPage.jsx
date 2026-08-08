import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizService } from '../services/quizService';
import QuestionEditor from '../components/quiz-builder/QuestionEditor';
import DoodleBackground from '../components/common/DoodleBackground';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function QuizBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      quizService
        .getQuizById(id)
        .then((data) => {
          setTitle(data.title);
          setDescription(data.description || '');
          setQuestions(data.questions || []);
        })
        .catch(() => setError('Failed to fetch quiz details.'));
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
    setError('');

    if (questions.length === 0) {
      setError('Please add at least one question.');
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
      setError('Error saving quiz. Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-pitch p-6 text-chalk overflow-hidden">
      <DoodleBackground variant="sparse" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-6">
          {id ? 'EDIT QUIZ' : 'CREATE NEW QUIZ'}
        </h1>

        {error && (
          <div className="p-3 mb-4 text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-turf rounded-xl border border-turf-light space-y-4">
            <Input
              label="Quiz Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="General Knowledge Master Quiz"
            />

            <Input
              as="textarea"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your quiz..."
            />
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

            <Button
              type="button"
              variant="dashed"
              onClick={handleAddQuestion}
              className="w-full"
            >
              + Add Question
            </Button>
          </div>

          <div className="flex gap-4">
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? 'SAVING…' : id ? 'UPDATE QUIZ' : 'SAVE QUIZ'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
