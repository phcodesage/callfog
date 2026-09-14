import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorScheme, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import ChatBubbleRounded from '@mui/icons-material/ChatBubbleRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import { useCallfog } from '../hooks/useCallfog';
import { VideoPlayer } from '../components/VideoPlayer';
import { MediaControls } from '../components/MediaControls';
import { ControlButton } from '../components/ControlButton';
import { Notification } from '../components/Notification';
import { Chat } from '../components/Chat';

interface RoomProps {
  roomId: string;
  userName: string;
  creatorKey: string | null;
  onLeave: (message?: string) => void;
}

const pipSize = { width: { xs: 104, sm: 176, md: 232 }, aspectRatio: { xs: '3 / 4', sm: '16 / 9' } };

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

export function Room({ roomId, userName, creatorKey, onLeave }: RoomProps) {
  const {
    connectionStatus,
    isConnected,
    joinError,
    error,
    clearError,
    endedReason,
    isRoomCreator,
    localStream,
    isMicEnabled,
    isCameraEnabled,
    isAudioOnly,
    isScreenSharing,
    canScreenShare,
    peer,
    audioBlocked,
    startAudio,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveCall,
    endCall,
    switchAudioDevice,
    switchVideoDevice,
    setAudioOutput,
    audioInputDeviceId,
    videoInputDeviceId,
    audioOutputDeviceId,
    messages,
    remoteTyping,
    sendMessage,
    sendTypingIndicator,
    clearChat,
  } = useCallfog({ roomId, userName, creatorKey });

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { setMode } = useColorScheme();

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [readCount, setReadCount] = useState(0);

  // Calls always use the dark scheme; the rest of the site follows the system.
  useEffect(() => {
    setMode('dark');
    return () => setMode('system');
  }, [setMode]);

  // Call timer, counted from when the other person is connected.
  const inCall = !!peer && isConnected;
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setCallStartedAt(inCall ? Date.now() : null);
  }, [inCall]);
  useEffect(() => {
    if (!callStartedAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [callStartedAt]);
  const elapsed = callStartedAt ? formatDuration(now - callStartedAt) : null;

  const closeNotification = useCallback(() => {
    setNotification(null);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (error) setNotification({ message: error, type: 'error' });
  }, [error]);

  useEffect(() => {
    if (endedReason) onLeave(endedReason);
  }, [endedReason, onLeave]);

  const remoteMessageCount = messages.filter((message) => !message.isLocal).length;
  useEffect(() => {
    if (isChatOpen) setReadCount(remoteMessageCount);
  }, [isChatOpen, remoteMessageCount]);
  const unreadCount = isChatOpen ? 0 : Math.max(0, remoteMessageCount - readCount);

  const inviteLink = `${window.location.origin}/room/${roomId}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotification({ message: 'Invite link copied', type: 'success' });
    } catch {
      setNotification({ message: 'Could not copy the link. Select it and copy it manually.', type: 'error' });
    }
  };

  const handleClearChat = () => {
    clearChat();
    setReadCount(0);
  };

  const handleLeave = async () => {
    if (isRoomCreator) await endCall();
    else await leaveCall();
    onLeave();
  };

  const localTile = (compact: boolean) => (
    <VideoPlayer
      stream={localStream}
      label={compact ? 'You' : `${userName} (you)`}
      videoEnabled={isCameraEnabled}
      audioEnabled={isMicEnabled}
      mirror
      compact={compact}
    />
  );

  const chat = peer && (
    <Chat
      onSendMessage={sendMessage}
      messages={messages}
      onTyping={sendTypingIndicator}
      remoteTyping={remoteTyping}
      remoteName={peer.name}
      onClearChat={handleClearChat}
      onClose={() => setIsChatOpen(false)}
    />
  );

  let stage;
  if (joinError) {
    stage = (
      <Box sx={{ m: 'auto', px: 1 }}>
        <Paper sx={{ p: { xs: 3, sm: 4 }, maxWidth: 440, borderRadius: '28px', bgcolor: 'surface.low' }}>
          <ErrorOutlineRounded color="error" sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h5" component="h2" gutterBottom>
            Couldn&apos;t join the call
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {joinError}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => onLeave()}>Go home</Button>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  } else if (peer) {
    const presenting = !!peer.screenStream;
    stage = (
      <Box sx={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0 }}>
        <VideoPlayer
          stream={peer.screenStream ?? peer.stream}
          label={presenting ? `${peer.name} is presenting` : peer.name}
          videoEnabled={presenting || peer.cameraEnabled}
          audioEnabled={peer.micEnabled}
          fit={presenting ? 'contain' : 'cover'}
        />
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            bottom: { xs: 8, sm: 16 },
            width: pipSize.width,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {presenting && (
            <Box sx={{ aspectRatio: pipSize.aspectRatio, borderRadius: '16px', boxShadow: 6 }}>
              <VideoPlayer stream={peer.stream} label={peer.name} videoEnabled={peer.cameraEnabled} audioEnabled={peer.micEnabled} compact />
            </Box>
          )}
          <Box sx={{ aspectRatio: pipSize.aspectRatio, borderRadius: '16px', boxShadow: 6 }}>{localTile(true)}</Box>
        </Box>
      </Box>
    );
  } else {
    stage = (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 360px' },
          alignContent: { xs: 'start', md: 'center' },
          alignItems: 'center',
          gap: { xs: 2, md: 3 },
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          pt: { xs: 1, md: 0 },
        }}
      >
        <Box sx={{ width: '100%', aspectRatio: { xs: '4 / 3', sm: '16 / 9' } }}>{localTile(false)}</Box>
        <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '28px', bgcolor: 'surface.low' }}>
          <Typography variant="h6" component="h2">
            Waiting for someone to join
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
            Send this link to the person you want to talk to. Only two people can be in a call.
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={inviteLink}
            onFocus={(event) => event.target.select()}
            slotProps={{ htmlInput: { readOnly: true, 'aria-label': 'Invite link' } }}
          />
          <Button fullWidth variant="contained" startIcon={<ContentCopyRounded />} onClick={copyInviteLink} sx={{ mt: 1.5 }}>
            Copy invite link
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', color: 'text.primary', overflow: 'hidden' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ pt: 'env(safe-area-inset-top)' }}>
        <Toolbar sx={{ gap: 1.5, px: { xs: 2, sm: 3 } }}>
          <Box
            aria-hidden
            sx={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: isConnected ? 'success.main' : 'warning.main' }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" component="h1" noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {peer ? peer.name : 'Callfog'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              aria-hidden
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {elapsed ?? connectionStatus}
            </Typography>
            <Box role="status" sx={visuallyHidden}>
              {connectionStatus}
            </Box>
          </Box>
          {isRoomCreator && <Chip label="Host" size="small" color="secondary" variant="outlined" />}
          <Tooltip title="Copy invite link">
            <IconButton aria-label="Copy invite link" onClick={copyInviteLink}>
              <LinkRounded />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {audioBlocked && peer && (
        <Alert
          severity="info"
          icon={<VolumeUpRounded />}
          action={
            <Button color="inherit" size="small" onClick={startAudio}>
              Turn on sound
            </Button>
          }
          sx={{ mx: { xs: 1, sm: 2 }, mb: 1 }}
        >
          Your browser paused {peer.name}&apos;s audio.
        </Alert>
      )}

      <Box component="main" sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2, px: { xs: 1, sm: 2 } }}>
        <Box sx={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, display: 'flex' }}>
          {stage}
          {!isConnected && !joinError && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  {connectionStatus}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {isDesktop && isChatOpen && chat && (
          <Paper sx={{ width: 360, flexShrink: 0, borderRadius: '28px', bgcolor: 'surface.low', overflow: 'hidden' }}>{chat}</Paper>
        )}
      </Box>

      {isConnected ? (
        <Box
          component="nav"
          aria-label="Call controls"
          sx={{ display: 'flex', justifyContent: 'center', px: 1, pt: 1.5, pb: 'calc(12px + env(safe-area-inset-bottom))' }}
        >
          <MediaControls
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={canScreenShare ? toggleScreenShare : undefined}
            onLeave={handleLeave}
            isAudioEnabled={isMicEnabled}
            isVideoEnabled={isCameraEnabled}
            isAudioOnly={isAudioOnly}
            isScreenSharing={isScreenSharing}
            isRoomCreator={isRoomCreator}
            onAudioInputChange={switchAudioDevice}
            onAudioOutputChange={setAudioOutput}
            onVideoInputChange={switchVideoDevice}
            audioInputDeviceId={audioInputDeviceId}
            audioOutputDeviceId={audioOutputDeviceId}
            videoInputDeviceId={videoInputDeviceId}
          >
            {peer && (
              <ControlButton
                label={isChatOpen ? 'Close chat' : 'Open chat'}
                onClick={() => setIsChatOpen(!isChatOpen)}
                tone={isChatOpen ? 'active' : 'neutral'}
                pressed={isChatOpen}
              >
                <Badge badgeContent={unreadCount} color="error" max={9}>
                  {isChatOpen ? <ChatBubbleRounded /> : <ChatBubbleOutlineRounded />}
                </Badge>
              </ControlButton>
            )}
          </MediaControls>
        </Box>
      ) : (
        <Box sx={{ height: 'calc(12px + env(safe-area-inset-bottom))' }} />
      )}

      {!isDesktop && (
        <Drawer
          anchor="bottom"
          open={!!chat && isChatOpen}
          onClose={() => setIsChatOpen(false)}
          slotProps={{
            paper: {
              sx: { height: '85dvh', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', bgcolor: 'surface.low' },
            },
          }}
        >
          {chat}
        </Drawer>
      )}

      {notification && (
        <Notification
          key={`${notification.type}:${notification.message}`}
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </Box>
  );
}
