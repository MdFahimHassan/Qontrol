import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import DoodleBackground from '../components/common/DoodleBackground';
import CursorTrail from '../components/common/CursorTrail';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login({ email, password });
      login(data.token, data.user || { email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 bg-pitch overflow-hidden">
      <DoodleBackground variant="sparse" />
      <CursorTrail />
      <div className="relative z-10 w-full max-w-md p-8 bg-turf rounded-xl shadow-2xl border border-turf-light animate-rise-in">
        <h2 className="font-display font-bold text-3xl text-center text-chalk mb-6">
          HOST LOGIN
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'SIGNING IN…' : 'SIGN IN'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-chalk-dim">
          Don't have a host account?{' '}
          <Link to="/register" className="text-cyan hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}