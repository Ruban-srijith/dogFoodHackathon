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
      if (['ADMIN'].includes(loggedUser.role) && from === '/') {
        navigate('/admin/audit');
      } else if (['ORGANIZER'].includes(loggedUser.role) && from === '/') {
        navigate('/organizer/dashboard');
      } else if (['JUDGE'].includes(loggedUser.role) && from === '/') {
        navigate('/judge/dashboard');
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
    <Card className="p-8 shadow-2xl border-slate-800 bg-slate-900/80">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-white">Sign In to DOGFOOD</h2>
        <p className="text-xs text-slate-400">Access your hackathon dashboard and assigned submissions</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
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
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
          Sign In
        </Button>
      </form>

      {/* Demo Credentials Quick-Fill for instant judging/testing exploration */}
      <div className="mt-6 pt-6 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Demo Quick Login</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@dogfood.local', 'DogfoodAdmin123!')}
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left transition"
          >
            <span className="font-semibold text-rose-400 block">Admin</span>
            <span className="text-[10px] text-slate-400 truncate block">admin@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('organizer@dogfood.local', 'DogfoodOrg123!')}
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left transition"
          >
            <span className="font-semibold text-indigo-400 block">Organizer</span>
            <span className="text-[10px] text-slate-400 truncate block">organizer@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('judge1@dogfood.local', 'DogfoodJudge123!')}
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left transition"
          >
            <span className="font-semibold text-amber-400 block">Judge 1</span>
            <span className="text-[10px] text-slate-400 truncate block">judge1@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('alice@dogfood.local', 'DogfoodUser123!')}
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-left transition"
          >
            <span className="font-semibold text-sky-400 block">Participant</span>
            <span className="text-[10px] text-slate-400 truncate block">alice@dogfood.local</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
          Create one now
        </Link>
      </div>
    </Card>
  );
};
