import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import CallEndRounded from '@mui/icons-material/CallEndRounded';
import MicOffRounded from '@mui/icons-material/MicOffRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import PresentToAllRounded from '@mui/icons-material/PresentToAllRounded';
import CancelPresentationRounded from '@mui/icons-material/CancelPresentationRounded';
import VideocamOffRounded from '@mui/icons-material/VideocamOffRounded';
import VideocamRounded from '@mui/icons-material/VideocamRounded';
import { ControlButton } from './ControlButton';
import { DeviceSelector } from './DeviceSelector';

interface MediaControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onLeave: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isAudioOnly?: boolean;
  isScreenSharing?: boolean;
  isRoomCreator?: boolean;
  onAudioInputChange: (deviceId: string) => void;
  onAudioOutputChange: (deviceId: string) => void;
  onVideoInputChange: (deviceId: string) => void;
  audioInputDeviceId?: string;
  audioOutputDeviceId?: string;
  videoInputDeviceId?: string;
  /** Extra controls (e.g. chat) placed before the end-call button. */
  children?: ReactNode;
}

export function MediaControls({
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  isAudioEnabled,
  isVideoEnabled,
  isAudioOnly = false,
  isScreenSharing = false,
  isRoomCreator = false,
  onAudioInputChange,
  onAudioOutputChange,
  onVideoInputChange,
  audioInputDeviceId,
  audioOutputDeviceId,
  videoInputDeviceId,
  children,
}: MediaControlsProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const micLabel = isAudioEnabled ? 'Mute microphone' : 'Unmute microphone';
  const cameraLabel = isAudioOnly && !isVideoEnabled
    ? 'Try turning on camera'
    : isVideoEnabled
    ? 'Turn off camera'
    : 'Turn on camera';
  const shareLabel = isScreenSharing ? 'Stop presenting' : 'Present your screen';
  const leaveLabel = isRoomCreator ? 'End call for everyone' : 'Leave call';

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.75, sm: 1.5 } }}>
        <DeviceSelector
          onAudioInputChange={onAudioInputChange}
          onAudioOutputChange={onAudioOutputChange}
          onVideoInputChange={onVideoInputChange}
          currentAudioInputId={audioInputDeviceId}
          currentAudioOutputId={audioOutputDeviceId}
          currentVideoInputId={videoInputDeviceId}
        />

        <ControlButton label={micLabel} onClick={onToggleAudio} tone={isAudioEnabled ? 'neutral' : 'off'} pressed={!isAudioEnabled}>
          {isAudioEnabled ? <MicRounded /> : <MicOffRounded />}
        </ControlButton>

        <ControlButton label={cameraLabel} onClick={onToggleVideo} tone={isVideoEnabled ? 'neutral' : 'off'} pressed={!isVideoEnabled}>
          {isVideoEnabled ? <VideocamRounded /> : <VideocamOffRounded />}
        </ControlButton>

        {onToggleScreenShare && (
          <ControlButton label={shareLabel} onClick={onToggleScreenShare} tone={isScreenSharing ? 'active' : 'neutral'} pressed={isScreenSharing}>
            {isScreenSharing ? <CancelPresentationRounded /> : <PresentToAllRounded />}
          </ControlButton>
        )}

        {children}

        <Tooltip title={leaveLabel}>
          <Button
            aria-label={leaveLabel}
            onClick={() => setShowLeaveConfirm(true)}
            sx={{
              minWidth: { xs: 60, sm: 84 },
              height: { xs: 44, sm: 52 },
              ml: { xs: 0.25, sm: 1 },
              px: 0,
              bgcolor: 'danger.main',
              color: 'danger.contrastText',
              '&:hover': { bgcolor: 'danger.main', filter: 'brightness(1.08)' },
            }}
          >
            <CallEndRounded />
          </Button>
        </Tooltip>
      </Box>

      <Dialog
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        aria-labelledby="leave-dialog-title"
        slotProps={{ paper: { sx: { bgcolor: 'surface.high', maxWidth: 380, m: 2 } } }}
      >
        <DialogTitle id="leave-dialog-title">
          {isRoomCreator ? 'End the call?' : 'Leave the call?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isRoomCreator
              ? 'You started this call. Ending it disconnects everyone and closes the room.'
              : "You can rejoin with the same link while the other person is still here."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setShowLeaveConfirm(false)} autoFocus>
            Cancel
          </Button>
          <Button
            onClick={onLeave}
            sx={{ bgcolor: 'danger.main', color: 'danger.contrastText', '&:hover': { bgcolor: 'danger.main', filter: 'brightness(1.08)' } }}
          >
            {isRoomCreator ? 'End call' : 'Leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
