import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../services/teamService';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { KeyRound } from 'lucide-react';

export const TeamJoinPage: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { success } = useToast();
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please provide an invite code');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const team = await teamService.joinTeam(inviteCode.trim());
      const teamId = team.id || (team as any)._id;
      success(`Successfully joined ${team.name}!`);
      navigate(`/teams/${teamId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join a Team</h1>
          <p className="text-xs text-slate-400">Enter the unique 8-character invite code provided by your team lead</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Team Invite Code"
            placeholder="e.g. GRAV2026"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="font-mono uppercase tracking-wider text-center text-lg"
            maxLength={12}
            required
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Join Team
          </Button>
        </form>
      </Card>
    </div>
  );
};
