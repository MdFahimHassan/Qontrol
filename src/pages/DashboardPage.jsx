import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizService';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      const data = await quizService.getMyQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError('Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await quizService.deleteQuiz(id);
      setQuizzes(quizzes.filter((q) => q.id !== id));
    } catch (err) {
      alert('Failed to delete quiz');
    }
  };

  return (
    <div className="min-h-screen bg-pitch p-6">
      <header className="max-w-5xl mx-auto flex justify-between items-center pb-6 border-b border-turf-light">
        <div>
          <h1 className="font-display font-bold text-3xl text-chalk">HOST DASHBOARD</h1>
          <p className="text-chalk-dim text-sm">Welcome back, {user?.username || 'Host'}</p>
        </div>
        <div className="flex gap-4">
          <Link
            to="/quiz/new"
            className="px-4 py-2 font-display font-bold text-pitch bg-amber rounded-lg hover:bg-amber-dim transition-colors"
          >
            + CREATE QUIZ
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 font-semibold text-chalk-dim bg-turf border border-turf-light rounded-lg hover:bg-turf-light transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8">
        {loading ? (
          <p className="text-chalk-dim font-mono text-sm">Loading quizzes…</p>
        ) : error ? (
          <p className="text-coral">{error}</p>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 bg-turf/50 rounded-xl border border-turf-light">
            <p className="text-chalk-dim mb-4">You haven't created any quizzes yet.</p>
            <Link
              to="/quiz/new"
              className="px-4 py-2 font-display font-bold text-pitch bg-amber rounded-lg hover:bg-amber-dim transition-colors"
            >
              CREATE YOUR FIRST QUIZ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-6 bg-turf rounded-xl border border-turf-light flex flex-col justify-between hover:border-cyan/40 transition-colors"
              >
                <div>
                  <h3 className="font-display font-bold text-xl text-chalk mb-2">
                    {quiz.title}
                  </h3>
                  <p className="text-chalk-dim text-sm mb-4 line-clamp-2">
                    {quiz.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-turf-light">
                  <Link
                    to={`/quiz/edit/${quiz.id}`}
                    className="flex-1 text-center py-2 bg-turf-light text-chalk rounded-lg hover:bg-turf-light/70 text-sm font-medium transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="px-3 py-2 bg-coral/10 text-coral border border-coral/30 rounded-lg hover:bg-coral/20 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}