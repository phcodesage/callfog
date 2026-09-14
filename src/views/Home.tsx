import { useEffect, useRef, useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import ShuffleRounded from '@mui/icons-material/ShuffleRounded';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import VideoCallRounded from '@mui/icons-material/VideoCallRounded';
import { ThemeToggle } from '../components/ThemeToggle';
import { generateRandomName } from '../utils/nameGenerator';
import { isValidRoomId } from '../lib/callfogApi';
import { loadUserName, takeCallEndedMessage } from '../lib/session';
import { Landing } from './Landing';

interface HomeProps {
  onCreateMeeting: (userName: string) => Promise<void>;
  onJoinMeeting: (roomId: string, userName: string) => void;
  autoJoinRoomId?: string;
  onCancelJoin?: () => void;
}

const facts = [
  { Icon: PersonOffOutlined, text: 'No sign-up. Use any name you like.' },
  { Icon: LockOutlined, text: 'Audio, video and chat are encrypted in transit.' },
  { Icon: TimerOutlined, text: 'The room closes a few minutes after you both leave.' },
];

function extractRoomId(input: string): string {
  const trimmed = input.trim();
  const fromLink = trimmed.includes('/room/') ? trimmed.split('/room/')[1].split(/[?#/]/)[0] : trimmed;
  return fromLink.toLowerCase();
}

export function Home({ onCreateMeeting, onJoinMeeting, autoJoinRoomId, onCancelJoin }: HomeProps) {
  const [userName, setUserName] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [showLanding, setShowLanding] = useState(!autoJoinRoomId);
  const [joinInputError, setJoinInputError] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(!!autoJoinRoomId);
  const [action, setAction] = useState<'create' | 'join' | null>(autoJoinRoomId ? 'join' : null);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const joinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const callEndedMessage = takeCallEndedMessage();
    if (callEndedMessage) setNotice({ message: callEndedMessage, type: 'info' });
    setUserName((current) => current || loadUserName() || '');
  }, []);

  const handleCreateClick = () => {
    setNotice(null);
    setAction('create');
    setShowNamePrompt(true);
  };

  const openCallConsole = (intent: 'create' | 'join') => {
    setShowLanding(false);
    if (intent === 'join') window.setTimeout(() => joinInputRef.current?.focus(), 0);
  };

  const handleJoinSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!joinInput.trim()) return;
    if (!isValidRoomId(extractRoomId(joinInput))) {
      setJoinInputError('Paste a Callfog invite link or a room code');
      return;
    }
    setNotice(null);
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

  const handleNameSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = userName.trim();
    if (!name || isBusy) return;

    if (action === 'create') {
      setIsBusy(true);
      try {
        await onCreateMeeting(name);
      } catch (err) {
        setNotice({ message: err instanceof Error ? err.message : 'Could not start a call. Try again.', type: 'error' });
        setIsBusy(false);
      }
    } else if (action === 'join') {
      onJoinMeeting(autoJoinRoomId ?? extractRoomId(joinInput), name);
    }
  };

  if (showLanding && !autoJoinRoomId) {
    return <Landing onStartCall={() => openCallConsole('create')} onJoinCall={() => openCallConsole('join')} />;
  }

  return (
    <Box component="main" className="paper-page" sx={{ minHeight: '100dvh', color: 'text.primary', display: 'flex', alignItems: { md: 'center' }, px: { xs: 2, sm: 4 }, py: { xs: 3, md: 5 } }}>
      <Box sx={{ width: '100%', maxWidth: 1040, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 4, md: 6 } }}>
          {!autoJoinRoomId ? (
            <Button variant="text" onClick={() => setShowLanding(true)} sx={{ color: 'text.secondary', px: 0, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}>
              ← Back to Callfog
            </Button>
          ) : <Box />}
          <ThemeToggle />
        </Box>
      <Box
        sx={{
          width: '100%',
          maxWidth: 1040,
          mx: 'auto',
          display: 'grid',
          columnGap: 8,
          rowGap: { xs: 4, md: 5 },
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 420px' },
          gridTemplateAreas: { xs: '"title" "card" "facts"', md: '"title card" "facts card"' },
        }}
      >
        <Box sx={{ gridArea: 'title', alignSelf: 'end' }}>
          <Typography
            component="h1"
            sx={{
              fontSize: 'clamp(3.5rem, 15vw, 7.5rem)',
              lineHeight: 0.95,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              ml: '-0.03em',
              color: 'primary.main',
            }}
          >
            Callfog
          </Typography>
          <Typography
            component="p"
            sx={{ mt: { xs: 1.5, md: 2.5 }, fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1.35, maxWidth: '24ch', textWrap: 'balance', color: 'text.secondary' }}
          >
            Private video and audio calls with a link. Nothing to install.
          </Typography>
        </Box>

        <Paper
          component="section"
          aria-label={showNamePrompt ? 'Choose a name' : 'Start or join a call'}
          sx={{
            gridArea: 'card',
            alignSelf: 'center',
            p: { xs: 3, sm: 4 },
            borderRadius: '28px',
            bgcolor: 'surface.low',
            border: 1,
            borderColor: 'divider',
          }}
        >
          {notice && (
            <Alert severity={notice.type} onClose={() => setNotice(null)} sx={{ mb: 3 }}>
              {notice.message}
            </Alert>
          )}

          {!showNamePrompt ? (
            <>
              <Typography variant="h6" component="h2">
                Start a call
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
                You&apos;ll get a link to send to one other person.
              </Typography>
              <Button fullWidth size="large" variant="contained" startIcon={<VideoCallRounded />} onClick={handleCreateClick}>
                Start a call
              </Button>

              <Divider sx={{ my: 3.5, color: 'text.secondary', typography: 'body2' }}>or</Divider>

              <Typography variant="h6" component="h2">
                Join a call
              </Typography>
              <Box
                component="form"
                onSubmit={handleJoinSubmit}
                noValidate
                sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'flex-start' }, gap: 1.5 }}
              >
                <TextField
                  fullWidth
                  inputRef={joinInputRef}
                  label="Invite link or room code"
                  value={joinInput}
                  onChange={(event) => {
                    setJoinInput(event.target.value);
                    setJoinInputError('');
                  }}
                  error={!!joinInputError}
                  helperText={joinInputError || undefined}
                  autoComplete="off"
                />
                <Button type="submit" variant="outlined" size="large" disabled={!joinInput.trim()} sx={{ flexShrink: 0, height: 56 }}>
                  Join
                </Button>
              </Box>
            </>
          ) : (
            <Box component="form" onSubmit={handleNameSubmit} noValidate>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: -1.5, mb: 0.5 }}>
                <IconButton aria-label="Back" onClick={handleBack}>
                  <ArrowBackRounded />
                </IconButton>
                <Typography variant="h6" component="h2">
                  {autoJoinRoomId ? 'Join the call' : 'Choose a name'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The other person will see this name. It isn&apos;t saved anywhere.
              </Typography>

              <TextField
                fullWidth
                autoFocus
                label="Your name"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                autoComplete="nickname"
                slotProps={{
                  htmlInput: { maxLength: 40 },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Suggest a name">
                          <IconButton aria-label="Suggest a name" edge="end" onClick={() => setUserName(generateRandomName())}>
                            <ShuffleRounded />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disabled={!userName.trim() || isBusy}
                startIcon={isBusy ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ mt: 2.5 }}
              >
                {isBusy ? 'Starting…' : action === 'create' ? 'Start call' : 'Join call'}
              </Button>
            </Box>
          )}
        </Paper>

        <Box
          component="ul"
          sx={{ gridArea: 'facts', alignSelf: 'start', listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2, maxWidth: '42ch' }}
        >
          {facts.map(({ Icon, text }) => (
            <Box component="li" key={text} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Icon sx={{ color: 'primary.main', mt: '1px' }} />
              <Typography variant="body1" color="text.secondary" sx={{ textWrap: 'pretty' }}>
                {text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      </Box>
    </Box>
  );
}
