import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Lock, Mail, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      success(`Welcome back, ${loggedUser.full_name}!`);
      
      // Smart redirect based on role
      const userRole = (loggedUser.role || '').toUpperCase();
      if (['ADMIN'].includes(userRole) && from === '/') {
        navigate('/admin/audit');
      } else if (['ORGANIZER'].includes(userRole) && from === '/') {
        navigate('/organizer/dashboard');
      } else if (['JUDGE'].includes(userRole) && from === '/') {
        navigate('/judge/dashboard');
      } else if (['PARTICIPANT'].includes(userRole) && from === '/') {
        navigate('/participant/dashboard');
      } else {
        navigate(from);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <Card className="p-8 shadow-2xl theme-card rounded-2xl backdrop-blur-xl relative z-10 border border-[var(--border-color)] bg-[var(--bg-surface)]">
      <div className="text-center space-y-1.5 mb-6">
        <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)] font-mono">
          Sign In to DOG<span className="text-[var(--accent-red)]">FOOD</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] font-sans">
          Access your hackathon dashboard and assigned submissions
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[var(--accent-red)] text-xs font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="developer@dogfood.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-[var(--accent-cyan)]" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-[var(--accent-cyan)]" />}
          required
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
          Sign In
        </Button>
      </form>

      {/* Demo Credentials Quick-Fill for instant judging/testing exploration */}
      <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] animate-pulse" />
          <span>Demo Quick Login</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@dogfood.local', 'DogfoodAdmin123!')}
            className="p-3 rounded-xl bg-[var(--bg-card)] hover:border-[var(--border-hover)] border border-[var(--border-color)] text-left transition hover:scale-[1.02]"
          >
            <span className="font-bold text-[var(--accent-red)] block font-mono">Admin</span>
            <span className="text-[10px] text-[var(--text-muted)] truncate block font-mono">admin@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('organizer@dogfood.local', 'DogfoodOrg123!')}
            className="p-3 rounded-xl bg-[var(--bg-card)] hover:border-[var(--border-hover)] border border-[var(--border-color)] text-left transition hover:scale-[1.02]"
          >
            <span className="font-bold text-[var(--accent-cyan)] block font-mono">Organizer</span>
            <span className="text-[10px] text-[var(--text-muted)] truncate block font-mono">organizer@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('judge1@dogfood.local', 'DogfoodJudge123!')}
            className="p-3 rounded-xl bg-[var(--bg-card)] hover:border-[var(--border-hover)] border border-[var(--border-color)] text-left transition hover:scale-[1.02]"
          >
            <span className="font-bold text-[var(--accent-green)] block font-mono">Judge 1</span>
            <span className="text-[10px] text-[var(--text-muted)] truncate block font-mono">judge1@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('alice@dogfood.local', 'DogfoodUser123!')}
            className="p-3 rounded-xl bg-[var(--bg-card)] hover:border-[var(--border-hover)] border border-[var(--border-color)] text-left transition hover:scale-[1.02]"
          >
            <span className="font-bold text-[var(--text-main)] block font-mono">Participant</span>
            <span className="text-[10px] text-[var(--text-muted)] truncate block font-mono">alice@dogfood.local</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-[var(--accent-cyan)] hover:underline font-mono">
          Create one now
        </Link>
      </div>
    </Card>
  );
};
