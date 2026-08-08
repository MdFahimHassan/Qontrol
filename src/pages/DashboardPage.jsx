import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizService';
import { useAuth } from '../hooks/useAuth';
import DoodleBackground from '../components/common/DoodleBackground';
import CursorTrail from '../components/common/CursorTrail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';
import Button from '../components/common/Button';

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

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

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await quizService.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError('Failed to delete quiz.');
    }
  };

  return (
    <div className="relative min-h-screen bg-pitch p-6 overflow-hidden">
      <DoodleBackground variant="sparse" />
      <CursorTrail />

      <header className="relative z-10 max-w-5xl mx-auto flex justify-between items-center pb-6 border-b border-turf-light">
        <div>
          <h1 className="font-display font-bold text-3xl text-chalk">HOST DASHBOARD</h1>
          <p className="font-doodle text-lg text-chalk-dim">Welcome back, {user?.username || 'Host'}</p>
        </div>
        <div className="flex gap-4">
          <Button to="/quiz/new" size="sm">
            + CREATE QUIZ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto mt-8">
        {loading ? (
          <div className="flex items-center gap-2 text-chalk-dim font-mono text-sm py-8">
            <LoadingSpinner size={18} />
            Loading quizzes…
          </div>
        ) : error ? (
          <p className="text-coral">{error}</p>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 bg-turf/50 rounded-xl border border-turf-light">
            <img
              src="/doodles/puzzle.gif"
              alt=""
              aria-hidden="true"
              className="w-20 h-20 mx-auto mb-4 opacity-80"
            />
            <p className="font-doodle text-lg text-chalk-dim mb-4">You haven't created any quizzes yet.</p>
            <Button to="/quiz/new" size="sm">
              CREATE YOUR FIRST QUIZ
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-6 bg-turf rounded-xl border border-turf-light flex flex-col justify-between transition-all hover:border-cyan/40 hover:-translate-y-1"
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
                  <Button variant="danger" size="sm" onClick={() => setPendingDeleteId(quiz.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete this quiz?"
        message="This can't be undone — players won't be able to join it anymore."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}