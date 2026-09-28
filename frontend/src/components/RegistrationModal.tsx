import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { teamService } from '../services/teamService';
import { Event } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import {
  X,
  UserCheck,
  PlusCircle,
  LogIn,
  Trophy,
  Sparkles,
} from 'lucide-react';

interface RegistrationModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'solo' | 'create' | 'join'>('solo');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleSoloRegister = async () => {
    if (!user) {
      navigate(`/login?redirect=/events/${event.slug || event.id}?register=true`);
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      await teamService.createTeam({
        event_id: event.id,
        name: `${user.full_name || user.username}'s Solo Squad`,
        description: 'Solo Hacker Registration',
      });
      success(`🎉 Successfully registered for ${event.title}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete solo registration');
      toastError('Registration failed. Please try again.');
    } fontally: () => {
      setLoading(false);
    }
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setFormError('Please enter a team name');
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      const team = await teamService.createTeam({
        event_id: event.id,
        name: teamName.trim(),
        description: 'Hackathon Team',
      });
      success(`🎉 Team "${team.name}" created and registered!`);
      if (onSuccess) onSuccess();
      onClose();
      navigate(`/teams/${team.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setFormError('Please enter an invite code');
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      const team = await teamService.joinTeam(inviteCode.trim());
      success(`🎉 Successfully joined team ${team.name}!`);
      if (onSuccess) onSuccess();
      onClose();
      navigate(`/teams/${team.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to join team with invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event Registration</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {!user ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sign In to Register</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You must be logged in to register your project or join a team for this hackathon.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => navigate(`/login?redirect=/events/${event.slug || event.id}?register=true`)}
                >
                  Log In & Continue Registration
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate(`/register?redirect=/events/${event.slug || event.id}?register=true`)}
                >
                  Create New Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Registration Options Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('solo')}
                  className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                    activeTab === 'solo'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Solo Register
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                    activeTab === 'create'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Team
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                    activeTab === 'join'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Join Team
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Tab 1: Solo Registration */}
              {activeTab === 'solo' && (
                <div className="space-y-4 text-center py-2">
                  <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <UserCheck className="w-4 h-4" /> 1-Click Individual Registration
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Participating as a solo developer? We will automatically set up your hacker workspace so you can begin submitting right away. You can invite team members later anytime.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full justify-center py-3 text-sm font-bold"
                    isLoading={loading}
                    onClick={handleSoloRegister}
                  >
                    Confirm Solo Registration 🚀
                  </Button>
                </div>
              )}

              {/* Tab 2: Create Team */}
              {activeTab === 'create' && (
                <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
                  <Input
                    label="Team Name"
                    placeholder="e.g. Telemetry Titans"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Creating a team registers you and generates a unique invite code for your squad.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center"
                    isLoading={loading}
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                  >
                    Create Team & Register
                  </Button>
                </form>
              )}

              {/* Tab 3: Join Team */}
              {activeTab === 'join' && (
                <form onSubmit={handleJoinTeamSubmit} className="space-y-4">
                  <Input
                    label="Team Invite Code"
                    placeholder="e.g. GRAV2026"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase tracking-wider text-center"
                    maxLength={12}
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Ask your team captain for the 8-character invite code to join their roster.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center"
                    isLoading={loading}
                    leftIcon={<LogIn className="w-4 h-4" />}
                  >
                    Join Team & Register
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
