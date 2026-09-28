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
    <Card className="p-8 shadow-2xl theme-card rounded-2xl backdrop-blur-xl relative z-10 border border-[var(--border-color)] bg-[var(--bg-surface)]">
      <div className="text-center space-y-1.5 mb-6">
        <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)] font-mono">
          Create an Account
        </h2>
        <p className="text-xs text-[var(--text-muted)] font-sans">
          Join the hackathon community as a builder or evaluator
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[var(--accent-red)] text-xs font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-[var(--accent-cyan)]" />}
          required
        />

        <Input
          label="Username"
          placeholder="adalovelace"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          leftIcon={<AtSign className="w-4 h-4 text-[var(--accent-cyan)]" />}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="ada@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-[var(--accent-cyan)]" />}
          required
        />

        <Input
          label="Password (min 8 chars)"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-[var(--accent-cyan)]" />}
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

      <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[var(--accent-cyan)] hover:underline font-mono">
          Sign In
        </Link>
      </div>
    </Card>
  );
};
