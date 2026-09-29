import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Card } from '../components/Card';
import { UserRole } from '../types';
import { Mail, Lock, User, AtSign } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PARTICIPANT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const newUser = await register({
        full_name: fullName,
        username,
        email,
        password,
        role,
      });
      success(`Welcome to DOGFOOD, ${newUser.full_name}!`);
      navigate('/events');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 rounded-[16px] border border-[#334155] bg-[#1E293B] shadow-lg relative z-10 font-body">
      {/* Distinct Detail: Rotated Badge & Skewed Accents */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-1 opacity-70">
          <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
          <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
          <span className="w-1.5 h-3 bg-[#A78BFA] skew-x-[-25deg]" />
        </div>
        <div className="transform -rotate-2 select-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#A78BFA] text-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider">
            NEW ACCOUNT
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mb-6 text-left">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-[#E2E8F0]">
          Create an Account
        </h1>
        <p className="text-xs text-[#94A3B8]">
          Join the hackathon community as a builder, judge, or organizer.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[4px] bg-[#0F172A] border border-[#F87171] text-[#F87171] text-xs font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-[#A78BFA]" />}
          required
        />

        <Input
          label="Username"
          placeholder="adalovelace"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          leftIcon={<AtSign className="w-4 h-4 text-[#A78BFA]" />}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="ada@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-[#A78BFA]" />}
          required
        />

        <Input
          label="Password (min 8 chars)"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-[#A78BFA]" />}
          required
        />

        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          options={[
            { value: 'PARTICIPANT', label: 'Participant (Build & Submit Projects)' },
            { value: 'JUDGE', label: 'Judge (Evaluate Assigned Submissions)' },
            { value: 'ORGANIZER', label: 'Organizer (Manage Hackathons & Results)' },
            { value: 'VISITOR', label: 'Visitor (Public Observer & Voter)' },
          ]}
        />

        <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[#94A3B8]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[#A78BFA] hover:underline font-mono">
          Sign In
        </Link>
      </div>
    </Card>
  );
};
