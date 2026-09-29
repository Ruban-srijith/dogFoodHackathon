import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const getDestinationForRole = (role: string, requestedPath?: string) => {
    const userRole = (role || '').toUpperCase();

    // If 'from' is a valid deep-link specifically matching this role's domain, honour it
    if (userRole === 'ADMIN') {
      if (requestedPath && (requestedPath.startsWith('/admin') || requestedPath.startsWith('/organizer'))) {
        return requestedPath;
      }
      return '/admin/audit';
    }

    if (userRole === 'ORGANIZER') {
      if (requestedPath && (requestedPath.startsWith('/organizer') || requestedPath.startsWith('/events'))) {
        return requestedPath;
      }
      return '/organizer/dashboard';
    }

    if (userRole === 'JUDGE') {
      if (requestedPath && requestedPath.startsWith('/judge')) {
        return requestedPath;
      }
      return '/judge/dashboard';
    }

    // Default: PARTICIPANT
    // If the participant was actively navigating to a specific event or submission detail:
    if (requestedPath && (requestedPath.startsWith('/events/') || requestedPath.startsWith('/submissions/'))) {
      return requestedPath;
    }

    // Default landing page for participants
    return '/participant/dashboard';
  };

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
      
      const destination = getDestinationForRole(loggedUser.role, from);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string, roleLanding: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(demoEmail, demoPass);
      success(`Welcome back, ${loggedUser.full_name}!`);
      navigate(roleLanding, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 rounded-[16px] border border-[#334155] bg-[#1E293B] shadow-lg relative z-10 font-body">
      {/* Distinct Detail: Rotated Badge & Diagonal Accent */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-1 opacity-70">
          <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
          <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
          <span className="w-1.5 h-3 bg-[#A78BFA] skew-x-[-25deg]" />
        </div>
        <div className="transform -rotate-2 select-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#A78BFA] text-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
            SECURE ACCESS
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mb-6 text-left">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-[#E2E8F0]">
          Sign In to DOGFOOD
        </h1>
        <p className="text-xs text-[#94A3B8]">
          Enter your credentials to access your hackathon console and submissions.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[4px] bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-xs font-mono">
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
          leftIcon={<Mail className="w-4 h-4 text-[#A78BFA]" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-[#A78BFA]" />}
          required
        />

        <Button type="submit" variant="primary" className="w-full mt-2 font-body font-semibold rounded-[4px]" isLoading={loading}>
          Sign In
        </Button>
      </form>

      {/* Demo Credentials Quick-Login for instant role portal exploration */}
      <div className="mt-6 pt-5 border-t border-[#334155]">
        <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 font-mono">
          <span>Demo Quick Login</span>
          <span className="text-[10px] text-[#A78BFA]">1-CLICK LOGIN</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@dogfood.local', 'DogfoodAdmin123!', '/admin/audit')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#E2E8F0] block font-mono text-[11px]">Admin Console</span>
            <span className="text-[10px] text-[#94A3B8] truncate block font-mono">admin@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('organizer@dogfood.local', 'DogfoodOrg123!', '/organizer/dashboard')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#A78BFA] block font-mono text-[11px]">Organizer Hub</span>
            <span className="text-[10px] text-[#94A3B8] truncate block font-mono">organizer@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('judge1@dogfood.local', 'DogfoodJudge123!', '/judge/dashboard')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#4ADE80] block font-mono text-[11px]">Judge Queue</span>
            <span className="text-[10px] text-[#94A3B8] truncate block font-mono">judge1@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('alice@dogfood.local', 'DogfoodUser123!', '/participant/dashboard')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#E2E8F0] block font-mono text-[11px]">Participant Hub</span>
            <span className="text-[10px] text-[#94A3B8] truncate block font-mono">alice@dogfood.local</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-[#94A3B8]">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-[#A78BFA] hover:underline font-mono">
          Create one now
        </Link>
      </div>
    </Card>
  );
};
