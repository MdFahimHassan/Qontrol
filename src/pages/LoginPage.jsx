import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

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
    <div className="flex items-center justify-center min-h-screen px-4 bg-pitch">
      <div className="w-full max-w-md p-8 bg-turf rounded-xl shadow-2xl border border-turf-light animate-rise-in">
        <h2 className="font-display font-bold text-3xl text-center text-chalk mb-6">
          HOST LOGIN
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-chalk-dim mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk focus:ring-2 focus:ring-amber outline-none transition-shadow"
              placeholder="host@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-chalk-dim mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-pitch border border-turf-light rounded-lg text-chalk focus:ring-2 focus:ring-amber outline-none transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-display font-bold text-pitch bg-amber rounded-lg hover:bg-amber-dim transition-colors disabled:opacity-50"
          >
            {loading ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
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