import { useState, useEffect } from 'react';
import { Video, Plus, LogIn, Shuffle } from 'lucide-react';
import { generateRandomName } from '../utils/nameGenerator';
import { isValidRoomId } from '../lib/callfogApi';
import { loadUserName, takeCallEndedMessage } from '../lib/session';

interface HomeProps {
  onCreateMeeting: (userName: string) => Promise<void>;
  onJoinMeeting: (roomId: string, userName: string) => void;
  autoJoinRoomId?: string;
  onCancelJoin?: () => void;
}

function extractRoomId(input: string): string {
  const trimmed = input.trim();
  const fromLink = trimmed.includes('/room/') ? trimmed.split('/room/')[1].split(/[?#/]/)[0] : trimmed;
  return fromLink.toLowerCase();
}

export function Home({ onCreateMeeting, onJoinMeeting, autoJoinRoomId, onCancelJoin }: HomeProps) {
  const [userName, setUserName] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(!!autoJoinRoomId);
  const [action, setAction] = useState<'create' | 'join' | null>(autoJoinRoomId ? 'join' : null);
  const [isBusy, setIsBusy] = useState(false);

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    const callEndedMessage = takeCallEndedMessage();
    if (callEndedMessage) setNotification({ message: callEndedMessage, type: 'info' });
    setUserName((current) => current || loadUserName() || '');
  }, []);

  const handleCreateClick = () => {
    setNotification(null);
    setAction('create');
    setShowNamePrompt(true);
  };

  const handleJoinClick = () => {
    if (!joinInput.trim()) return;
    if (!isValidRoomId(extractRoomId(joinInput))) {
      setNotification({ message: "That doesn't look like a Callfog link or room code", type: 'error' });
      return;
    }
    setNotification(null);
    setAction('join');
    setShowNamePrompt(true);
  };

  const handleBack = () => {
    if (autoJoinRoomId && onCancelJoin) {
      onCancelJoin();
      return;
    }
    setShowNamePrompt(false);
    setAction(null);
  };

  const handleSubmitName = async () => {
    const name = userName.trim();
    if (!name || isBusy) return;

    if (action === 'create') {
      setIsBusy(true);
      try {
        await onCreateMeeting(name);
      } catch (err) {
        setNotification({ message: err instanceof Error ? err.message : 'Could not create a call', type: 'error' });
        setIsBusy(false);
      }
    } else if (action === 'join') {
      onJoinMeeting(autoJoinRoomId ?? extractRoomId(joinInput), name);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-slide-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/20 rounded-3xl mb-6 shadow-2xl border border-indigo-500/30 animate-pulse-glow">
            <Video className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-bold mb-3 text-gradient">
            Callfog
          </h1>
          <p className="text-slate-400 font-medium">Anonymous, quick video &amp; audio calls</p>
        </div>

        {!showNamePrompt ? (
          <div className="glass rounded-3xl p-8 space-y-6 animate-slide-in">
            <button
              onClick={handleCreateClick}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.4)] group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Start a call
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/40 text-slate-400 rounded-full border border-white/5 backdrop-blur-sm">or</span>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter room code or invite link"
                aria-label="Room code or invite link"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinClick()}
                className="w-full px-5 py-4 bg-slate-950/50 border border-white/10 text-white placeholder-slate-500 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all duration-300"
              />
              <button
                onClick={handleJoinClick}
                disabled={!joinInput.trim()}
                className="w-full glass-button text-white font-medium py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 group"
              >
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300 text-indigo-400" />
                Join a call
              </button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-8 space-y-6 animate-slide-in">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {autoJoinRoomId ? 'Join this call' : 'Pick a name'}
              </h2>
              <p className="text-slate-400">
                {autoJoinRoomId
                  ? `Enter any name to join room ${autoJoinRoomId}`
                  : 'Any name works. No account, nothing saved.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your name"
                  aria-label="Your name"
                  value={userName}
                  maxLength={40}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitName()}
                  autoFocus
                  className="w-full px-5 py-4 pr-12 bg-slate-950/50 border border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setUserName(generateRandomName())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-200 group"
                  title="Generate random name"
                  aria-label="Generate random name"
                >
                  <Shuffle className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>
              <p className="text-sm text-slate-500 text-center">
                Click <Shuffle className="w-4 h-4 inline text-slate-400" /> for a random name
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 glass-button text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Back
              </button>
              <button
                onClick={handleSubmitName}
                disabled={!userName.trim() || isBusy}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                {isBusy ? 'Starting…' : action === 'create' ? 'Start call' : 'Join call'}
              </button>
            </div>
          </div>
        )}

        {notification && (
          <div
            role="status"
            className={`p-4 rounded-2xl text-sm border backdrop-blur-md animate-slide-in ${
              notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
              'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="text-center text-sm text-slate-500 animate-slide-in">
          <p>No accounts · encrypted in transit · rooms vanish when empty</p>
        </div>
      </div>
    </div>
  );
}
