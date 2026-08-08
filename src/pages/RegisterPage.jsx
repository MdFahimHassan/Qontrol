import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import DoodleBackground from '../components/common/DoodleBackground';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register({ username, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 bg-pitch overflow-hidden">
      <DoodleBackground variant="sparse" />
      <div className="relative z-10 w-full max-w-md p-8 bg-turf rounded-xl shadow-2xl border border-turf-light animate-rise-in">
        <h2 className="font-display font-bold text-3xl text-center text-chalk mb-6">
          CREATE HOST ACCOUNT
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="quizmaster"
          />

          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="host@example.com"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'CREATING ACCOUNT…' : 'REGISTER'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-chalk-dim">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
