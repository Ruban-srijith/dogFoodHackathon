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

      {/* Demo Credentials Quick-Fill for instant judging/testing exploration */}
      <div className="mt-6 pt-5 border-t border-[#334155]">
        <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 font-mono">
          <span>Demo Quick Login</span>
          <span className="text-[10px] text-[#A78BFA]">1-CLICK FILL</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@dogfood.local', 'DogfoodAdmin123!')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#E2E8F0] block font-mono text-[11px]">Admin</span>
            <span className="text-[10px] text-[#94A3B8] truncate block font-mono">admin@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('organizer@dogfood.local', 'DogfoodOrg123!')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#A78BFA] block font-mono text-[11px]">Organizer</span>
            <span className="text-[10px] text-[#94A3B8] truncate block font-mono">organizer@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('judge1@dogfood.local', 'DogfoodJudge123!')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#4ADE80] block font-mono text-[11px]">Judge 1</span>
            <span className="text-[10px] text-[#94A3B8] truncate block font-mono">judge1@dogfood.local</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('alice@dogfood.local', 'DogfoodUser123!')}
            className="p-2.5 rounded-[4px] bg-[#0F172A] hover:border-[#A78BFA]/50 border border-[#334155] text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-[#E2E8F0] block font-mono text-[11px]">Participant</span>
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
